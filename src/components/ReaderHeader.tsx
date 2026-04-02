import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Book, Search, Shield, LogOut, LogIn, Calendar, BookOpen, BookText, FileText, Clock, Heart, Navigation, MapPin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoSrc from "@/assets/star-of-david-logo.png";

interface ReaderHeaderProps {
  onToggleSearch: () => void;
  onToggleBookSelector: () => void;
  onToggleNotes?: () => void;
  onToggleDictionary?: () => void;
  onToggleHistory?: () => void;
  onToggleFavorites?: () => void;
  onToggleGoTo?: () => void;
  onToggleMap?: () => void;
  onShare?: () => void;
}

const ReaderHeader = ({
  onToggleSearch,
  onToggleBookSelector,
  onToggleNotes,
  onToggleDictionary,
  onToggleHistory,
  onToggleFavorites,
  onToggleGoTo,
  onToggleMap,
  onShare,
}: ReaderHeaderProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full h-16 bg-background/95 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4 md:px-8" role="banner" aria-label="Cabeçalho da Bíblia Alpha">
      <div className="flex items-center gap-3">
        <a href="/" aria-label="Ir para a página inicial da Bíblia Alpha">
          <img src={logoSrc} alt="Logo da Bíblia Alpha" className="w-10 h-10 drop-shadow" width={40} height={40} />
        </a>
        <div className="hidden sm:block">
          <h1 className="text-base tracking-[0.3em] font-serif font-medium text-foreground">
            BÍBLIA
          </h1>
          <p className="text-xs tracking-[0.4em] font-sans font-light text-primary ml-2">
            ALPHA
          </p>
        </div>
      </div>

      <nav className="flex items-center gap-0.5 overflow-x-auto" aria-label="Navegação principal" role="navigation">
        <Button variant="ghost" size="icon" onClick={onToggleBookSelector} title="Livros" aria-label="Abrir seletor de livros">
          <Book className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onToggleSearch} title="Buscar" aria-label="Abrir busca">
          <Search className="w-4 h-4" aria-hidden="true" />
        </Button>
        {onToggleGoTo && (
          <Button variant="ghost" size="icon" onClick={onToggleGoTo} title="Ir Para" aria-label="Abrir navegação">
            <Navigation className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {onToggleNotes && (
          <Button variant="ghost" size="icon" onClick={onToggleNotes} title="Notas de Estudo" aria-label="Abrir notas de estudo">
            <BookOpen className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {onToggleDictionary && (
          <Button variant="ghost" size="icon" onClick={onToggleDictionary} title="Dicionário Bíblico" aria-label="Abrir dicionário bíblico">
            <BookText className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {onToggleHistory && (
          <Button variant="ghost" size="icon" onClick={onToggleHistory} title="Histórico" aria-label="Abrir histórico de leitura">
            <Clock className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {onToggleFavorites && (
          <Button variant="ghost" size="icon" onClick={onToggleFavorites} title="Favoritos" aria-label="Abrir favoritos">
            <Heart className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {onToggleMap && (
          <Button variant="ghost" size="icon" onClick={onToggleMap} title="Mapa Bíblico" aria-label="Abrir mapa bíblico">
            <MapPin className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {onShare && (
          <Button variant="ghost" size="icon" onClick={onShare} title="Compartilhar Capítulo" aria-label="Compartilhar capítulo atual">
            <Share2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => navigate("/prefacio")} title="Prefácio" aria-label="Abrir prefácio">
          <FileText className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => navigate("/planos")} title="Planos de Leitura" aria-label="Abrir planos de leitura">
          <Calendar className="w-4 h-4" aria-hidden="true" />
        </Button>
        {isAdmin && (
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} title="Administração" aria-label="Abrir painel de administração">
            <Shield className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
        {user ? (
          <Button variant="ghost" size="icon" onClick={signOut} title="Sair" aria-label="Sair da conta">
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" onClick={() => navigate("/login")} title="Entrar" aria-label="Fazer login">
            <LogIn className="w-4 h-4" aria-hidden="true" />
          </Button>
        )}
      </nav>
    </header>
  );
};

export default ReaderHeader;
