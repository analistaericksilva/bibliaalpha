import { AppWindow, Share2, MessageSquare, BookOpen, Sparkles, Zap, Smartphone, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppActionProps {
  icon: any;
  title: string;
  description: string;
  onClick?: () => void;
  color?: string;
}

const AppAction = ({ icon: Icon, title, description, onClick, color }: AppActionProps) => (
  <div 
    onClick={onClick}
    className="manus-app-card group"
  >
    <div className={cn("p-2 rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white", color)}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
  </div>
);

export const BibleApplications = () => {
  return (
    <div className="mt-12 mb-8 border-t border-border/50 pt-8 animate-fade-in-up">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold tracking-tight">Aplicações e Conexões</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppAction 
          icon={Smartphone} 
          title="Conectar ao App Mobile" 
          description="Sincronize sua leitura com o aplicativo iOS/Android."
          color="bg-blue-500/10 text-blue-600"
        />
        <AppAction 
          icon={MessageSquare} 
          title="Compartilhar no WhatsApp" 
          description="Envie este capítulo para seus grupos de estudo."
          color="bg-green-500/10 text-green-600"
        />
        <AppAction 
          icon={Zap} 
          title="Insights da IA" 
          description="Gerar resumo e aplicações práticas com IA."
          color="bg-purple-500/10 text-purple-600"
        />
        <AppAction 
          icon={AppWindow} 
          title="Exportar para Notion" 
          description="Salve suas notas e referências no seu workspace."
          color="bg-zinc-500/10 text-zinc-600"
        />
      </div>
      
      <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Plano de Leitura Ativo</p>
            <p className="text-xs text-muted-foreground">Você está no dia 12 do plano "Fundamentos da Fé"</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          Continuar
        </button>
      </div>
    </div>
  );
};

export default BibleApplications;
