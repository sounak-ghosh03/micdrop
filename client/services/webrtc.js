/**
 * WebRTC utility helpers for MicDrop live performance streaming.
 *
 * This module is intentionally thin — it owns only:
 *   - ICE server configuration
 *   - RTCPeerConnection factory
 *   - getUserMedia wrapper
 *
 * All signaling (SDP offer/answer, ICE candidate exchange) is handled
 * by Socket.IO inside the useWebRTC hook. The actual media stream
 * travels directly peer-to-peer via DTLS/SRTP (WebRTC transport).
 *
 * TURN server (optional):
 *   Set NEXT_PUBLIC_TURN_URL, NEXT_PUBLIC_TURN_USERNAME, and
 *   NEXT_PUBLIC_TURN_CREDENTIAL in client/.env for deployments where
 *   direct peer-to-peer connectivity is blocked by symmetric NAT.
 */

//ICE configuration 

const buildIceServers = () => {
   const servers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
   ];

   if (process.env.NEXT_PUBLIC_TURN_URL) {
      servers.push({
         urls: process.env.NEXT_PUBLIC_TURN_URL,
         username: process.env.NEXT_PUBLIC_TURN_USERNAME ?? "",
         credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL ?? "",
      });
   }

   return servers;
};

export const RTC_CONFIG = {
   iceServers: buildIceServers(),
};

// factories 

/**
 * Create a new RTCPeerConnection using the shared ICE config.
 * @returns {RTCPeerConnection}
 */
export const createPeerConnection = () => new RTCPeerConnection(RTC_CONFIG);

/**
 * Request camera and/or microphone access from the browser.
 * Defaults to both video and audio for a live performance.
 *
 * @param {MediaStreamConstraints} [constraints]
 * @returns {Promise<MediaStream>}
 */
export const getLocalStream = (
   constraints = { video: true, audio: true }
) => navigator.mediaDevices.getUserMedia(constraints);
