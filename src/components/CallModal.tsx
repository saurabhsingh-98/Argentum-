"use client"

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type UserProfile = Database['public']['Tables']['users']['Row']

interface CallModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  currentUser: any;
  otherParticipant: any;
  initialIncomingCall: { type: 'audio'|'video', offer: RTCSessionDescriptionInit } | null;
  startVideo: boolean;
}

export default function CallModal({
  isOpen, onClose, conversationId, currentUser, otherParticipant, initialIncomingCall, startVideo
}: CallModalProps) {
  const supabase = createClient()
  const [status, setStatus] = useState<'ringing' | 'calling' | 'connected'>(initialIncomingCall ? 'ringing' : 'calling')
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(!startVideo)
  const [isFullscreen, setIsFullscreen] = useState(false)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  
  const peerConnection = useRef<RTCPeerConnection | null>(null)
  const localStream = useRef<MediaStream | null>(null)
  const signalingChannel = useRef<any>(null)
  
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  }

  useEffect(() => {
    if (!isOpen) {
      cleanupCall()
      return
    }

    const initCall = async () => {
      // 1. Setup local media
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          alert("Calls require HTTPS. Make sure you're on the secure version of the site.")
          onClose()
          return
        }

        // Check permission state first if the API is available
        if (navigator.permissions) {
          try {
            const micPerm = await navigator.permissions.query({ name: 'microphone' as PermissionName })
            if (micPerm.state === 'denied') {
              alert('Microphone is blocked. Go to browser Settings → Site permissions → Microphone → Allow this site, then refresh.')
              onClose()
              return
            }
            if (startVideo || initialIncomingCall?.type === 'video') {
              const camPerm = await navigator.permissions.query({ name: 'camera' as PermissionName })
              if (camPerm.state === 'denied') {
                alert('Camera is blocked. Go to browser Settings → Site permissions → Camera → Allow this site, then refresh.')
                onClose()
                return
              }
            }
          } catch {
            // permissions API not supported, proceed anyway
          }
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: startVideo || (initialIncomingCall?.type === 'video')
        })
        localStream.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream
      } catch (err: any) {
        console.error('Failed to get local media', err)
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          alert('Microphone/Camera access was denied. In your browser, click the lock icon in the address bar → Site settings → allow Microphone and Camera, then refresh.')
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          alert('No microphone or camera found. Please connect a device and try again.')
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          alert('Microphone/Camera is in use by another app. Close other apps and try again.')
        } else {
          alert(`Could not access microphone/camera: ${err.message || err.name}`)
        }
        onClose()
        return
      }

      // 2. Setup RTCPeerConnection
      const pc = new RTCPeerConnection(rtcConfig)
      peerConnection.current = pc
      
      localStream.current.getTracks().forEach(track => {
        pc.addTrack(track, localStream.current!)
      })

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // 3. Setup signaling channel
      const channel = supabase.channel(`webrtc:${conversationId}`)
      signalingChannel.current = channel

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: 'broadcast',
            event: 'webrtc-signal',
            payload: { sender: currentUser.id, type: 'candidate', candidate: event.candidate }
          })
        }
      }

      channel.on('broadcast', { event: 'webrtc-signal' }, async ({ payload }) => {
        if (payload.sender === currentUser.id) return

        if (payload.type === 'answer' && peerConnection.current?.signalingState === 'have-local-offer') {
          await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer))
          setStatus('connected')
        } 
        else if (payload.type === 'candidate') {
          await peerConnection.current?.addIceCandidate(new RTCIceCandidate(payload.candidate))
        }
        else if (payload.type === 'end') {
          onClose()
        }
      }).subscribe(async (state) => {
        if (state === 'SUBSCRIBED') {
           if (!initialIncomingCall) {
               // We are the caller. Create offer.
               const offer = await pc.createOffer()
               await pc.setLocalDescription(offer)
               channel.send({
                   type: 'broadcast',
                   event: 'webrtc-signal',
                   payload: { sender: currentUser.id, type: 'offer', callType: startVideo ? 'video' : 'audio', offer }
               })
           } else if (initialIncomingCall) {
               // We are answering.
               await pc.setRemoteDescription(new RTCSessionDescription(initialIncomingCall.offer))
           }
        }
      })
    }

    initCall()
    
    return () => cleanupCall()
  }, [isOpen])

  const answerCall = async () => {
    if (!peerConnection.current || !signalingChannel.current || !initialIncomingCall) return
    setStatus('connected')
    const answer = await peerConnection.current.createAnswer()
    await peerConnection.current.setLocalDescription(answer)
    signalingChannel.current.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: { sender: currentUser.id, type: 'answer', answer }
    })
  }

  const cleanupCall = () => {
    if (signalingChannel.current) {
      signalingChannel.current.send({
        type: 'broadcast',
        event: 'webrtc-signal',
        payload: { sender: currentUser.id, type: 'end' }
      })
      signalingChannel.current.unsubscribe()
      signalingChannel.current = null
    }
    if (peerConnection.current) {
      peerConnection.current.close()
      peerConnection.current = null
    }
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop())
      localStream.current = null
    }
  }

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoOff(!videoTrack.enabled)
      }
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
        setIsFullscreen(false)
      }
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className={`relative bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full rounded-none border-none' : 'w-full max-w-4xl h-[80vh]'}`}
        >
          {/* Header */}
          <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
             <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border border-white/20">
                  {otherParticipant.avatar_url ? (
                    <img src={otherParticipant.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold">{otherParticipant.username[0].toUpperCase()}</div>
                  )}
               </div>
               <div>
                  <h3 className="font-bold text-lg">{otherParticipant.display_name || otherParticipant.username}</h3>
                  <p className="text-xs text-white/60 font-mono uppercase tracking-widest">
                    {status === 'calling' ? 'Calling...' : status === 'ringing' ? 'Incoming Call' : 'Encrypted Connection'}
                  </p>
               </div>
             </div>
             
             <button onClick={toggleFullscreen} className="p-3 bg-white/10 hover:bg-white/20 rounded-full transition-all text-white">
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
             </button>
          </div>

          {/* Videos */}
          <div className="flex-1 relative bg-black flex items-center justify-center">
             {(startVideo || (initialIncomingCall?.type === 'video')) && status === 'connected' ? (
                <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
             ) : (
                <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center animate-pulse">
                  <Phone size={40} className="text-white/40" />
                </div>
             )}

             {/* Picture in Picture */}
             <div className="absolute bottom-24 right-6 w-32 h-48 md:w-48 md:h-72 bg-black border border-white/20 rounded-2xl overflow-hidden shadow-2xl z-20">
                <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                {isVideoOff && (
                  <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
                    <VideoOff size={24} className="text-white/50" />
                  </div>
                )}
             </div>
          </div>

          {/* Controls */}
          <div className="absolute bottom-0 inset-x-0 p-8 flex items-center justify-center gap-6 z-10 bg-gradient-to-t from-black/90 to-transparent">
             
             {status === 'ringing' ? (
                <div className="flex items-center gap-8">
                  <button onClick={() => { cleanupCall(); onClose(); }} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                    <PhoneOff size={24} />
                  </button>
                  <button onClick={answerCall} className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition-all shadow-[0_0_30px_rgba(34,197,94,0.5)] animate-bounce">
                    <Phone size={24} />
                  </button>
                </div>
             ) : (
                <>
                  <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                  <button onClick={() => { cleanupCall(); onClose(); }} className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                    <PhoneOff size={28} />
                  </button>
                  <button onClick={toggleVideo} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
                  </button>
                </>
             )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
