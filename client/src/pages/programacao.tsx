import { useLocation } from 'wouter';
import Layout from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProgramacao, ProgramItem } from '@/contexts/ProgramacaoContext';
import { organs } from '@/lib/organs';
import { Trash2 } from 'lucide-react';

export default function Programacao() {
  const [, navigate] = useLocation();
  const { programacao, removeItem } = useProgramacao();

  const handleBack = () => navigate('/');

  const grouped = programacao.reduce<Record<string, ProgramItem[]>>((acc, item) => {
    if (!acc[item.organKey]) acc[item.organKey] = [];
    acc[item.organKey].push(item);
    return acc;
  }, {});

  const organName = (key: string) => organs.find(o => o.key === key)?.name || key;

  const handlePlay = (item: ProgramItem) => {
    navigate(`/organ/${item.organKey}/hymn/${item.hymnIndex}`);
  };

  return (
    <Layout title="Programação" breadcrumbs={["Programação"]} showBackButton onBackClick={handleBack}>
      <div className="max-w-4xl mx-auto">
        {programacao.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-church-text opacity-75">Nenhum hino programado.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([organKey, items]) => (
            <Card key={organKey} className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-church-primary mb-4">{organName(organKey)}</h3>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={`${item.organKey}-${item.hymnIndex}`} className="flex items-center justify-between">
                      <span className="text-church-text">{item.titulo}</span>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" onClick={() => handlePlay(item)} data-testid={`button-play-${item.organKey}-${item.hymnIndex}`}>
                          Tocar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => removeItem(item.organKey, item.hymnIndex)}
                          className="px-2"
                          data-testid={`button-remove-${item.organKey}-${item.hymnIndex}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}
