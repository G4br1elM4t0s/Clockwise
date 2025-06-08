import { useState, useEffect } from "react"
import { Volume2, VolumeX, Volume1 } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"

interface VolumeSliderProps {
  className?: string
}

export function VolumeSlider({ className = "" }: VolumeSliderProps) {
  const [volume, setVolume] = useState(75)
  const [isMuted, setIsMuted] = useState(false)
  const [isSliderVisible, setIsSliderVisible] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // Carregar volume inicial do sistema
  useEffect(() => {
    const loadInitialVolume = async () => {
      try {
        const systemVolume = (await invoke("get_system_volume")) as number
        const systemMute = (await invoke("get_system_mute_status")) as boolean
        setVolume(systemVolume)
        setIsMuted(systemMute)
      } catch (error) {
        console.error("Erro ao carregar volume inicial:", error)
      }
    }

    loadInitialVolume()
  }, [])

  // Escutar mudanças de volume do sistema
  useEffect(() => {
    const setupVolumeListeners = async () => {
      await listen("volume-changed", event => {
        const newVolume = event.payload as number
        setVolume(newVolume)
      })

      await listen("mute-changed", event => {
        const newMute = event.payload as boolean
        setIsMuted(newMute)
      })
    }

    setupVolumeListeners()
  }, [])

  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume)
    try {
      await invoke("set_system_volume", { volume: newVolume })
    } catch (error) {
      console.error("Erro ao alterar volume:", error)
    }
  }

  const handleMuteToggle = async () => {
    try {
      const newMuteStatus = (await invoke("toggle_system_mute")) as boolean
      setIsMuted(newMuteStatus)
    } catch (error) {
      console.error("Erro ao alternar mute:", error)
    }
  }

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="w-4 h-4 text-red-400" />
    } else if (volume < 50) {
      return <Volume1 className="w-4 h-4 text-blue-400" />
    } else {
      return <Volume2 className="w-4 h-4 text-blue-400" />
    }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value)
    handleVolumeChange(newVolume)
  }

  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div
      className={`flex items-center gap-2 relative ${className}`}
      onMouseEnter={() => setIsSliderVisible(true)}
      onMouseLeave={() => !isDragging && setIsSliderVisible(false)}
    >
      {/* Ícone de Volume */}
      <button
        onClick={handleMuteToggle}
        className="hover:bg-gray-700/50 p-1 rounded transition-colors"
        title={isMuted ? "Desmutar" : "Mutar"}
      >
        {getVolumeIcon()}
      </button>

      {/* Porcentagem */}
      <span className="text-xs text-gray-300 min-w-[30px]">{isMuted ? "0%" : `${volume}%`}</span>

      {/* Slider (aparece no hover) */}
      <div
        className={`absolute left-full ml-2 transition-all duration-200 ${
          isSliderVisible || isDragging
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-2 pointer-events-none"
        }`}
        style={{ zIndex: 1000 }}
      >
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border border-gray-600/50">
          <div className="flex items-center gap-3">
            {/* Slider */}
            <div className="relative w-24">
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={handleSliderChange}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                className="volume-slider w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                disabled={isMuted}
              />

              {/* Indicador visual do volume */}
              <div
                className="absolute top-0 left-0 h-2 bg-blue-500 rounded-lg pointer-events-none transition-all duration-150"
                style={{
                  width: `${isMuted ? 0 : volume}%`,
                  opacity: isMuted ? 0.3 : 1
                }}
              />
            </div>

            {/* Valor numérico */}
            <span className="text-xs text-gray-300 min-w-[35px] font-mono">
              {isMuted ? "MUTE" : `${volume}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
