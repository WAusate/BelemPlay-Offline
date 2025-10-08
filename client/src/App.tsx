import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { SimpleToastContainer } from "@/components/simple-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/error-boundary";
import { ProgramacaoProvider } from "@/contexts/ProgramacaoContext";
import Home from "@/pages/home";
import HymnList from "@/pages/hymn-list";
import Player from "@/pages/player";
import Admin from "@/pages/admin";
import Config from "@/pages/config";
import NotFound from "@/pages/not-found";
import Programacao from "@/pages/programacao";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/organ/:organKey">
        {(params) => <HymnList organKey={params.organKey} />}
      </Route>
      <Route path="/organ/:organKey/hymn/:hymnIndex">
        {(params) => <Player organKey={params.organKey} hymnIndex={params.hymnIndex} />}
      </Route>
      <Route path="/programacao" component={Programacao} />
      <Route path="/admin" component={Admin} />
      <Route path="/config" component={Config} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProgramacaoProvider>
          <TooltipProvider>
            <div className="min-h-screen bg-gray-50">
              <Router />
              <SimpleToastContainer />
            </div>
          </TooltipProvider>
        </ProgramacaoProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
