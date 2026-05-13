"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPeerConnection, getLocalStream } from "../services/webrtc";

/**
 * useWebRTC — manages WebRTC peer connections for live performance streaming.
 *
 * Role "broadcaster":
 *   1. Acquires camera + mic via getUserMedia.
 *   2. Emits "webrtc:broadcaster-ready" so the server registers this socket.
 *   3. For every viewer that sends "webrtc:viewer-ready", creates one
 *      RTCPeerConnection, adds local tracks, creates an SDP offer, and
 *      sends it via Socket.IO ("webrtc:offer").
 *   4. Handles SDP answers and ICE candidates from each viewer.
 *
 * Role "viewer":
 *   1. Emits "webrtc:viewer-ready" so the broadcaster knows to send an offer.
 *      (Also re-emits on "webrtc:broadcaster-ready" in case they joined late.)
 *   2. Handles the incoming SDP offer, creates an RTCPeerConnection, adds an
 *      answer, and sends it back via Socket.IO ("webrtc:answer").
 *   3. Handles ICE candidates from the broadcaster.
 *   4. Renders the remote stream via the returned remoteStream ref.
 *
 * All SDP / ICE messages travel via Socket.IO (signaling only).
 * The actual audio/video media travels directly peer-to-peer via WebRTC.
 *
 * @param {object} options
 * @param {"broadcaster"|"viewer"|null} options.role
 * @param {string|null}  options.performanceId
 * @param {import("socket.io-client").Socket|null} options.socket
 * @param {boolean}      options.isLive  – gate: WebRTC only activates when true
 *
 * @returns {{
 *   localStream:  MediaStream|null,
 *   remoteStream: MediaStream|null,
 *   mediaError:   string|null,
 * }}
 */
const useWebRTC = ({ role, performanceId, socket, isLive }) => {
   const [localStream, setLocalStream] = useState(null);
   const [remoteStream, setRemoteStream] = useState(null);
   const [mediaError, setMediaError] = useState(null);

   // broadcaster: Map<viewerSocketId, RTCPeerConnection>
   const broadcasterPcs = useRef(new Map());
   // viewer: single RTCPeerConnection to the broadcaster
   const viewerPc = useRef(null);
   // keep localStream accessible inside callbacks without stale closure
   const localStreamRef = useRef(null);

   /* cleanup */

   const cleanup = useCallback(() => {
      broadcasterPcs.current.forEach((pc) => pc.close());
      broadcasterPcs.current.clear();
      viewerPc.current?.close();
      viewerPc.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      setLocalStream(null);
      setRemoteStream(null);
   }, []);

   /* broadcaster helpers  */

   /**
    * Create one RTCPeerConnection for a viewer, attach local tracks,
    * wire ICE, then create + send an SDP offer.
    */
   const connectToViewer = useCallback(
      async (viewerSocketId) => {
         if (!localStreamRef.current || !socket) return;

         const pc = createPeerConnection();
         broadcasterPcs.current.set(viewerSocketId, pc);

         // Add all local media tracks
         localStreamRef.current
            .getTracks()
            .forEach((track) => pc.addTrack(track, localStreamRef.current));

         // Trickle ICE → viewer
         pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
               socket.emit("webrtc:ice-candidate", {
                  targetSocketId: viewerSocketId,
                  performanceId,
                  candidate,
               });
            }
         };

         // Auto-prune closed/failed connections
         pc.onconnectionstatechange = () => {
            if (
               pc.connectionState === "closed" ||
               pc.connectionState === "failed"
            ) {
               broadcasterPcs.current.delete(viewerSocketId);
            }
         };

         const offer = await pc.createOffer();
         await pc.setLocalDescription(offer);

         socket.emit("webrtc:offer", {
            targetSocketId: viewerSocketId,
            performanceId,
            sdp: offer,
         });
      },
      [socket, performanceId],
   );

   /* main effect  */

   useEffect(() => {
      if (!socket || !performanceId || !isLive || !role) return;

      let cancelled = false;

      /* broadcaster path  */
      if (role === "broadcaster") {
         getLocalStream()
            .then((stream) => {
               if (cancelled) {
                  stream.getTracks().forEach((t) => t.stop());
                  return;
               }
               localStreamRef.current = stream;
               setLocalStream(stream);

               // Register with server so viewers can find this broadcaster
               socket.emit("webrtc:broadcaster-ready", performanceId);
            })
            .catch((err) => {
               if (cancelled) return;
               setMediaError(
                  err.name === "NotAllowedError"
                     ? "Camera / microphone access was denied. Please allow access and refresh."
                     : `Could not access media: ${err.message}`,
               );
            });

         // Server tells us a viewer wants a stream — send them an offer
         const onViewerReady = ({ viewerSocketId } = {}) => {
            if (!viewerSocketId || cancelled) return;
            connectToViewer(viewerSocketId).catch((err) =>
               console.error("[useWebRTC] connectToViewer error:", err),
            );
         };

         // Viewer sends back their SDP answer
         const onAnswer = ({ sdp, fromSocketId } = {}) => {
            if (cancelled) return;
            const pc = broadcasterPcs.current.get(fromSocketId);
            if (!pc) return;
            pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(
               (err) =>
                  console.error("[useWebRTC] setRemoteDescription error:", err),
            );
         };

         // ICE candidate from a viewer
         const onIceCandidate = ({ candidate, fromSocketId } = {}) => {
            if (cancelled) return;
            const pc = broadcasterPcs.current.get(fromSocketId);
            if (!pc || !candidate) return;
            pc.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) =>
               console.error("[useWebRTC] addIceCandidate error:", err),
            );
         };

         socket.on("webrtc:viewer-ready", onViewerReady);
         socket.on("webrtc:answer", onAnswer);
         socket.on("webrtc:ice-candidate", onIceCandidate);

         return () => {
            cancelled = true;
            socket.off("webrtc:viewer-ready", onViewerReady);
            socket.off("webrtc:answer", onAnswer);
            socket.off("webrtc:ice-candidate", onIceCandidate);
            cleanup();
         };
      }

      /* viewer path */
      if (role === "viewer") {
         // Tell the broadcaster (via server) we're ready to receive
         const requestOffer = () => {
            socket.emit("webrtc:viewer-ready", { performanceId });
         };
         requestOffer();

         // If broadcaster announces themselves (e.g. we joined before them),
         // re-request so we get an offer
         const onBroadcasterReady = () => {
            if (!cancelled) requestOffer();
         };

         // Broadcaster sends us their SDP offer
         const onOffer = async ({ sdp, fromSocketId } = {}) => {
            if (cancelled || !sdp) return;

            // Close any previous connection
            viewerPc.current?.close();

            const pc = createPeerConnection();
            viewerPc.current = pc;

            // Incoming remote stream → state
            pc.ontrack = ({ streams }) => {
               if (!cancelled && streams?.[0]) setRemoteStream(streams[0]);
            };

            // Trickle ICE → broadcaster
            pc.onicecandidate = ({ candidate }) => {
               if (candidate) {
                  socket.emit("webrtc:ice-candidate", {
                     targetSocketId: fromSocketId,
                     performanceId,
                     candidate,
                  });
               }
            };

            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            socket.emit("webrtc:answer", {
               targetSocketId: fromSocketId,
               performanceId,
               sdp: answer,
            });
         };

         // ICE candidate from broadcaster
         const onIceCandidate = ({ candidate, fromSocketId: _ } = {}) => {
            if (cancelled || !candidate || !viewerPc.current) return;
            viewerPc.current
               .addIceCandidate(new RTCIceCandidate(candidate))
               .catch((err) =>
                  console.error("[useWebRTC] addIceCandidate error:", err),
               );
         };

         // Broadcaster disconnected mid-stream
         const onBroadcasterLeft = () => {
            if (!cancelled) setRemoteStream(null);
         };

         socket.on("webrtc:broadcaster-ready", onBroadcasterReady);
         socket.on("webrtc:offer", onOffer);
         socket.on("webrtc:ice-candidate", onIceCandidate);
         socket.on("webrtc:broadcaster-left", onBroadcasterLeft);

         return () => {
            cancelled = true;
            socket.off("webrtc:broadcaster-ready", onBroadcasterReady);
            socket.off("webrtc:offer", onOffer);
            socket.off("webrtc:ice-candidate", onIceCandidate);
            socket.off("webrtc:broadcaster-left", onBroadcasterLeft);
            cleanup();
         };
      }
   }, [role, performanceId, socket, isLive, connectToViewer, cleanup]);

   return { localStream, remoteStream, mediaError };
};

export default useWebRTC;
