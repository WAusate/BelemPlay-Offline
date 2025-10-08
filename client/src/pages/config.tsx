import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { AddHymnForm } from "@/components/add-hymn-form";
import { getAllHymns } from "@/lib/offline-db";
import { organs } from "@/lib/organs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showSimpleToast } from "@/components/simple-toast";

interface HymnSummary {
  organKey: string;
  count: number;
}

function ConfigContent() {
  const { user, logout, updatePassword } = useAuth();
  const [, setLocation] = useLocation();
  const [hymnSummary, setHymnSummary] = useState<HymnSummary[]>([]);

  const organLabels = useMemo(() => {
    const map = new Map<string, string>();
    organs.forEach((organ) => {
      map.set(organ.key, organ.name);
    });
    return map;
  }, []);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newPassword.trim()) {
      showSimpleToast('Informe a nova senha.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showSimpleToast('A confirmação da senha não confere.', 'error');
      return;
    }

    setChangingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      showSimpleToast('Senha atualizada com sucesso!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      if (error?.code === 'auth/wrong-password') {
        showSimpleToast('Senha atual inválida.', 'error');
      } else {
        showSimpleToast('Não foi possível atualizar a senha.', 'error');
      }
    } finally {
      setChangingPassword(false);
    }
  };

  useEffect(() => {
    const loadSummary = async () => {
      const data = await getAllHymns();
      const grouped = new Map<string, number>();
      data.forEach((hymn) => {
        grouped.set(hymn.organKey, (grouped.get(hymn.organKey) ?? 0) + 1);
      });
      const summary: HymnSummary[] = Array.from(grouped.entries()).map(([organKey, count]) => ({
        organKey,
        count,
      }));
      summary.sort((a, b) => organLabels.get(a.organKey)?.localeCompare(organLabels.get(b.organKey) ?? "") ?? 0);
      setHymnSummary(summary);
    };

    loadSummary();

    const listener = () => loadSummary();
    window.addEventListener("hymn-db-changed", listener);
    return () => window.removeEventListener("hymn-db-changed", listener);
  }, [organLabels]);

  const handleLogout = async () => {
    try {
      await logout();
      setLocation('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Layout title="Adicionar Hinos" showBackButton>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-end items-center">
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                <strong>Usuário:</strong> {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          )}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-church-primary">Adicionar Hino</CardTitle>
            <CardDescription>
              Os hinos adicionados ficam disponíveis imediatamente e permanecem no dispositivo, sem depender de internet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AddHymnForm />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-church-primary">Resumo da Biblioteca</CardTitle>
            <CardDescription>
              Total de hinos armazenados localmente por órgão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {hymnSummary.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum hino cadastrado ainda.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {hymnSummary.map(({ organKey, count }) => (
                  <li key={organKey} className="flex justify-between border-b pb-1 last:border-b-0">
                    <span>{organLabels.get(organKey) ?? organKey}</span>
                    <span className="font-semibold">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-church-primary">Senha do Administrador</CardTitle>
            <CardDescription>
              Defina uma senha personalizada para proteger a adição de novos hinos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Senha atual"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Nova senha"
                  required
                  minLength={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Confirme a nova senha"
                  required
                  minLength={4}
                />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? 'Atualizando...' : 'Atualizar Senha'}
                </Button>
              </div>
              <p className="md:col-span-2 text-xs text-muted-foreground">
                Senha padrão inicial: <strong>belem123</strong>.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

export default function Config() {
  return (
    <ProtectedRoute>
      <ConfigContent />
    </ProtectedRoute>
  );
}
