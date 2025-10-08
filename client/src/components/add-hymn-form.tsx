import { useState } from 'react';
import { organs } from '@/lib/organs';
import { addHymn } from '@/lib/offline-db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSimpleToast } from '@/components/simple-toast';

export function AddHymnForm() {
  const [organKey, setOrganKey] = useState(organs[0]?.key ?? '');
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organKey) {
      showSimpleToast('Selecione um órgão.', 'error');
      return;
    }

    if (!title.trim()) {
      showSimpleToast('Informe o título do hino.', 'error');
      return;
    }

    if (!file) {
      showSimpleToast('Escolha um arquivo MP3.', 'error');
      return;
    }

    if (!file.name.toLowerCase().endsWith('.mp3')) {
      showSimpleToast('Somente arquivos MP3 são suportados.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addHymn(organKey, { titulo: title.trim(), file });
      showSimpleToast('Hino adicionado com sucesso!');
      setTitle('');
      setFile(null);
      const input = document.getElementById('hymn-file-input') as HTMLInputElement | null;
      if (input) {
        input.value = '';
      }
    } catch (error) {
      console.error('Erro ao adicionar hino:', error);
      showSimpleToast('Não foi possível salvar o hino. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label>Órgão</Label>
        <Select value={organKey} onValueChange={setOrganKey}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o órgão" />
          </SelectTrigger>
          <SelectContent>
            {organs.map((organ) => (
              <SelectItem key={organ.key} value={organ.key}>
                {organ.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="hymn-title">Título do hino</Label>
        <Input
          id="hymn-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex: Grande é o Senhor"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="hymn-file-input">Arquivo MP3</Label>
        <Input
          id="hymn-file-input"
          type="file"
          accept="audio/mpeg"
          onChange={(event) => {
            const selected = event.target.files?.[0] ?? null;
            setFile(selected);
          }}
          required
        />
        <p className="text-xs text-muted-foreground">
          O arquivo será armazenado localmente no dispositivo e ficará disponível imediatamente.
        </p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : 'Adicionar Hino'}
        </Button>
      </div>
    </form>
  );
}
