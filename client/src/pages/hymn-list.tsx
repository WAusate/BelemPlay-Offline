                      import { useLocation } from "wouter";
                      import { Button } from "@/components/ui/button";
                      import { Card, CardContent } from "@/components/ui/card";
                      import Layout from "@/components/layout";
                      import { organs } from "@/lib/organs";
                      import { useHymns } from "@/hooks/use-hymns";
                      import { Play, ChevronRight } from "lucide-react";
                      import { Checkbox } from "@/components/ui/checkbox";
                      import { useProgramacao } from "@/contexts/ProgramacaoContext";

                      interface HymnListProps {
                        organKey: string;
                      }

                      export default function HymnList({ organKey }: HymnListProps) {
                        const [, navigate] = useLocation();
                        const organ = organs.find((o) => o.key === organKey);
                        const { hymns, isLoading, error, isOnline, hasOfflineData } = useHymns(organKey);
                        const { toggleItem, isProgrammed } = useProgramacao();

                        const handleHymnSelect = (hymnIndex: number) => {
                          navigate(`/organ/${organKey}/hymn/${hymnIndex}`);
                        };

                        const handleBack = () => {
                          navigate("/");
                        };

                        if (!organ) {
                          return (
                            <Layout 
                              title="Órgão não encontrado" 
                              showBackButton={true}
                              onBackClick={handleBack}
                            >
                              <div className="text-center">
                                <p className="text-church-text">Órgão não encontrado.</p>
                              </div>
                            </Layout>
                          );
                        }

                        if (isLoading) {
                          return (
                            <Layout 
                              title={organ.name}
                              breadcrumbs={[organ.name]}
                              showBackButton={true}
                              onBackClick={handleBack}
                            >
                              <div className="text-center py-8">
                                <div className="h-8 w-8 mx-auto mb-4 border-2 border-church-primary border-r-transparent rounded-full animate-spin"></div>
                                <p className="text-church-text">Carregando hinos...</p>
                              </div>
                            </Layout>
                          );
                        }

                        if (error && !hasOfflineData) {
                          return (
                            <Layout 
                              title={organ.name}
                              breadcrumbs={[organ.name]}
                              showBackButton={true}
                              onBackClick={handleBack}
                            >
                              <div className="text-center py-8">
                                <p className="text-church-text text-red-600">
                                  Erro ao carregar hinos. Verifique sua conexão.
                                </p>
                              </div>
                            </Layout>
                          );
                        }

                        return (
                          <Layout 
                            title={organ.name}
                            breadcrumbs={[organ.name]}
                            showBackButton={true}
                            onBackClick={handleBack}
                          >
                            <div className="max-w-4xl mx-auto">
                              <Card className="bg-white shadow-lg overflow-hidden">
                                <div className="bg-church-primary p-6">
                                  <h2 className="text-2xl font-bold text-white mb-2">
                                    Hinos do {organ.name}
                                  </h2>
                                  <p className="text-church-light">Selecione um hino para reproduzir ou programar{!isOnline && hasOfflineData && " (modo offline)"}
                                  </p>
                                </div>

                                <CardContent className="p-6">
                                  {hymns.length === 0 ? (
                                    <div className="text-center py-8">
                                      <p className="text-church-text opacity-75">
                                        Nenhum hino encontrado para este órgão.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {hymns.map((hymn, index) => (
                                        <Button
                                          key={`hymn-${index}-${hymn.titulo}`}
                                          variant="ghost"
                                          className="w-full h-auto p-0"
                                          onClick={() => handleHymnSelect(index)}
                                        >
                                          <Card className="w-full border-2 border-gray-100 hover:border-church-secondary hover:bg-church-light hover:bg-opacity-10 transition-all duration-200 group">
                                            <CardContent className="p-4">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center text-left flex-1 min-w-0">
                                                  <span className="text-church-primary font-bold text-lg mr-3 md:mr-4 bg-church-light bg-opacity-30 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm md:text-lg">
                                                    {index + 1}
                                                  </span>
                                                  <div className="flex-1 min-w-0 pr-2 text-left">
                                                    <h3 className="text-church-text font-semibold group-hover:text-church-primary text-sm md:text-base truncate text-left">
                                                      {hymn.titulo}
                                                    </h3>
                                                    <p className="text-church-text opacity-60 text-xs md:text-sm text-left">
                                                      Hino {index + 1}
                                                    </p>
                                                  </div>
                                                </div>
                                                <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                                                  <label
                                                    className="flex items-center space-x-1 whitespace-nowrap"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    <Checkbox
                                                      checked={isProgrammed(organKey, index)}
                                                      onCheckedChange={() =>
                                                        toggleItem({ organKey, hymnIndex: index, titulo: hymn.titulo })
                                                      }
                                                    />
                                                    <span className="text-xs md:text-sm text-church-text">Programar</span>
                                                  </label>
                                                  <Play className="text-church-accent text-lg mr-1 md:mr-2 opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 md:h-5 md:w-5" />
                                                  <ChevronRight className="text-church-text opacity-40 group-hover:opacity-100 transition-opacity h-4 w-4" />
                                                </div>
                                              </div>
                                            </CardContent>
                                          </Card>
                                        </Button>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            </div>
                          </Layout>
                        );
                      }
