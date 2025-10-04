              import { useState, useRef, useEffect } from "react";
              import { Button } from "@/components/ui/button";
              import { Slider } from "@/components/ui/slider";
              import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
              import { HymnData } from "@shared/schema";

              interface AudioPlayerProps {
                hymn: HymnData;
                onError?: (error: string) => void;
                onPlay?: () => void; // mantido do HEAD
              }

              export default function AudioPlayer({ hymn, onError, onPlay }: AudioPlayerProps) {
                const audioRef = useRef<HTMLAudioElement>(null);
                const [isPlaying, setIsPlaying] = useState(false);
                const [currentTime, setCurrentTime] = useState(0);
                const [duration, setDuration] = useState(0);
                const [volume, setVolume] = useState(50);
                const [isMuted, setIsMuted] = useState(false);
                const [isLoading, setIsLoading] = useState(true);

                useEffect(() => {
                  const audio = audioRef.current;
                  if (!audio) return;

                  if (!hymn.url || hymn.url.trim() === '') {
                    setIsLoading(false);
                    onError?.("URL do áudio não disponível. Tente sincronizar novamente.");
                    return;
                  }

                  const currentSrc = audio.src;
                  const newSrc = hymn.url;

                  if (currentSrc !== newSrc) {
                    setIsLoading(true);
                    setIsPlaying(false);
                    setCurrentTime(0);
                    setDuration(0);

                    audio.removeAttribute('src');
                    audio.load();

                    const cleanUrl = newSrc.trim().replace(/\n/g, '').replace(/\r/g, '').replace(/\s+/g, ' ').trim();
                    try {
                      if (cleanUrl.includes('firebasestorage.googleapis.com')) {
                        audio.removeAttribute('crossOrigin');
                      } else {
                        audio.removeAttribute('crossOrigin');
                      }
                      audio.src = cleanUrl;
                      audio.load();
                    } catch (error) {
                      onError?.("Erro ao carregar áudio. Tente novamente.");
                    }
                  }

                  const handleLoadedMetadata = () => {
                    setDuration(audio.duration);
                    setIsLoading(false);
                  };

                  const handleTimeUpdate = () => setCurrentTime(audio.currentTime);

                  const handleEnded = () => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                  };

                  const handleError = () => {
                    setIsLoading(false);
                    onError?.("Erro ao reproduzir o áudio. Faça deploy da aplicação.");
                  };

                  const handleLoadStart = () => setIsLoading(true);
                  const handleCanPlay = () => setIsLoading(false);

                  const handlePlayEvent = () => setIsPlaying(true);
                  const handlePauseEvent = () => setIsPlaying(false);

                  audio.addEventListener("loadedmetadata", handleLoadedMetadata);
                  audio.addEventListener("timeupdate", handleTimeUpdate);
                  audio.addEventListener("ended", handleEnded);
                  audio.addEventListener("error", handleError);
                  audio.addEventListener("loadstart", handleLoadStart);
                  audio.addEventListener("canplay", handleCanPlay);
                  audio.addEventListener("play", handlePlayEvent);
                  audio.addEventListener("pause", handlePauseEvent);

                  return () => {
                    try {
                      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
                      audio.removeEventListener("timeupdate", handleTimeUpdate);
                      audio.removeEventListener("ended", handleEnded);
                      audio.removeEventListener("error", handleError);
                      audio.removeEventListener("loadstart", handleLoadStart);
                      audio.removeEventListener("canplay", handleCanPlay);
                      audio.removeEventListener("play", handlePlayEvent);
                      audio.removeEventListener("pause", handlePauseEvent);
                    } catch {}
                  };
                }, [hymn.url, onError]);

                useEffect(() => {
                  const audio = audioRef.current;
                  if (audio) {
                    audio.volume = isMuted ? 0 : volume / 100;
                  }
                }, [volume, isMuted]);

                const togglePlayPause = async () => {
                  const audio = audioRef.current;
                  if (!audio) return;

                  try {
                    if (isPlaying) {
                      audio.pause();
                    } else {
                      await audio.play();
                      onPlay?.(); // dispara callback extra
                      setIsPlaying(true);
                    }
                  } catch (error: any) {
                    onError?.(`Erro ao reproduzir o áudio: ${error.message}`);
                  }
                };

                const handleSeek = (value: number[]) => {
                  const audio = audioRef.current;
                  if (audio && duration > 0) {
                    const newTime = (value[0] / 100) * duration;
                    audio.currentTime = newTime;
                    setCurrentTime(newTime);
                  }
                };

                const skipBackward = () => {
                  const audio = audioRef.current;
                  if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
                };

                const skipForward = () => {
                  const audio = audioRef.current;
                  if (audio) audio.currentTime = Math.min(duration, audio.currentTime + 10);
                };

                const toggleMute = () => setIsMuted(!isMuted);

                const handleVolumeChange = (value: number[]) => {
                  const newVolume = value[0];
                  setVolume(newVolume);
                  // Força atualização do volume no elemento de áudio
                  const audio = audioRef.current;
                  if (audio) {
                    audio.volume = isMuted ? 0 : newVolume / 100;
                  }
                };

                const formatTime = (seconds: number) => {
                  const minutes = Math.floor(seconds / 60);
                  const remainingSeconds = Math.floor(seconds % 60);
                  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
                };

                const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

                if (!hymn.url || hymn.url.trim() === '') {
                  return (
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                      <div className="bg-gradient-to-r from-church-primary to-church-secondary p-8 text-center">
                        <h2 className="text-2xl font-bold text-white mb-2">{hymn.titulo}</h2>
                        <p className="text-church-light">Áudio não disponível. Tente sincronizar novamente.</p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-church-primary to-church-secondary p-8 text-center">
                      <h2 className="text-2xl font-bold text-white mb-2">{hymn.titulo}</h2>
                      <p className="text-church-light">
                        {isLoading ? "Carregando..." : "Pronto para reproduzir"}
                      </p>
                    </div>

                    <div className="p-8">
                      <audio ref={audioRef} preload="metadata" crossOrigin="anonymous" controls={false}>
                        Seu navegador não suporta o elemento de áudio.
                      </audio>

                      {/* Progress Bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-sm text-church-text mb-2">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                        <Slider value={[progressPercentage]} onValueChange={handleSeek} max={100} step={1} className="w-full" />
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-center space-x-6 mb-6">
                        <Button variant="ghost" size="lg" onClick={skipBackward} disabled={isLoading} className="text-church-secondary hover:text-church-primary">
                          <SkipBack className="h-6 w-6" />
                        </Button>

                        <Button onClick={togglePlayPause} disabled={isLoading} className="bg-church-primary hover:bg-church-secondary text-white rounded-full w-16 h-16 shadow-lg" size="lg">
                          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                        </Button>

                        <Button variant="ghost" size="lg" onClick={skipForward} disabled={isLoading} className="text-church-secondary hover:text-church-primary">
                          <SkipForward className="h-6 w-6" />
                        </Button>
                      </div>

                      {/* Audio Visualizer */}
                      {isPlaying && (
                        <div className="audio-visualizer flex justify-center items-center mb-4 h-12">
                          <div className="flex items-end space-x-1">
                            {[...Array(15)].map((_, i) => (
                              <div
                                key={i}
                                className="bg-gradient-to-t from-church-primary to-church-secondary rounded-t-sm equalizer-bar"
                                style={{
                                  width: '4px',
                                  height: `${8 + (i % 3) * 4}px`,
                                  animationDelay: `${i * 0.1}s`,
                                  animationDuration: `${0.5 + (i % 3) * 0.2}s`
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Volume Control */}
                      <div className="flex items-center justify-center space-x-3">
                        <Button variant="ghost" size="sm" onClick={toggleMute} className="text-church-text">
                          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                        <div className="w-32">
                          <Slider value={[volume]} onValueChange={handleVolumeChange} max={100} step={1} className="w-full" />
                        </div>
                        <span key={`volume-${volume}`} className="text-xs text-church-text w-8">{volume}%</span>
                      </div>
                    </div>
                  </div>
                );
              }
