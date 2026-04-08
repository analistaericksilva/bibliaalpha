import { useState } from "react";
import { Database, Shield, FileText, BookOpen, Languages, Link2, MessageSquare, Search, Star, MapPin, Users, FileSignature, Heading, Scroll } from "lucide-react";
import { useReaderSettings } from "@/contexts/ReaderSettingsContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ModuleStatus {
  id: string;
  name: string;
  installed: boolean;
  loading: boolean;
  version?: string;
}

interface ModuleCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  modules: ModuleStatus[];
}

const ModuleManager = () => {
  const readerSettings = useReaderSettings();
  
  const [activeTab, setActiveTab] = useState("bibles");
  const [isInstalling, setIsInstalling] = useState<string | null>(null);

  const categories: ModuleCategory[] = [
    {
      id: "bibles",
      name: "Bíblias",
      icon: BookOpen,
      description: "Módulos de traduções bíblicas",
      modules: [
        { id: "nvi", name: "Nova Versão Internacional", installed: true, loading: false, version: "2.0" },
        { id: "ra", name: "Almeida Revisada", installed: true, loading: false, version: "1.5" },
        { id: "acf", name: "Almeida Corrigida Fiel", installed: true, loading: false, version: "3.0" },
        { id: "kjv", name: "King James Version", installed: false, loading: false },
        { id: "vulgata", name: "Vulgata Latina", installed: false, loading: false },
        { id: "lh", name: "Louvor & Henrique", installed: false, loading: false },
        { id: "nbb", name: "Nova Biblia de Jardim", installed: false, loading: false },
        { id: "bb", name: "Bible Basket", installed: false, loading: false },
      ]
    },
    {
      id: "strong",
      name: "Números Strong",
      icon: Hash,
      description: "Dicionários Hebreu/Grego com números Strong",
      modules: [
        { id: "strong_hebrew", name: "Dicionário Hebraico Strong", installed: false, loading: false },
        { id: "strong_greek", name: "Dicionário Grego Strong", installed: false, loading: false },
        { id: "strong_enhanced", name: "Strong Aprimorado", installed: false, loading: false },
      ]
    },
    {
      id: "morphology",
      name: "Morfologia",
      icon: Languages,
      description: "Códigos gramaticais gregos e hebraicos",
      modules: [
        { id: "rmac", name: "RMAC - Greek Morphology", installed: false, loading: false },
        { id: "hb morphological", name: "Hebrew Morphology", installed: false, loading: false },
        { id: "vnm", name: "Robinson's Morphological", installed: false, loading: false },
      ]
    },
    {
      id: "dictionaries",
      name: "Dicionários",
      icon: Search,
      description: "Dicionários e enciclopédias bíblicas",
      modules: [
        { id: "vined", name: "Vine's Expository Dictionary", installed: false, loading: false },
        { id: "smith", name: "Smith's Bible Dictionary", installed: false, loading: false },
        { id: "eastons", name: "Easton's Bible Dictionary", installed: false, loading: false },
        { id: "isbe", name: "International Standard Bible", installed: false, loading: false },
        { id: "kitto", name: "Kitto's Cyclopedia", installed: false, loading: false },
      ]
    },
    {
      id: "commentaries",
      name: "Comentários",
      icon: MessageSquare,
      description: "Comentários de autores conhecidos",
      modules: [
        { id: "matthew_henry", name: "Matthew Henry (Completo)", installed: false, loading: false },
        { id: "john_macarthur", name: "John MacArthur", installed: false, loading: false },
        { id: "barnes", name: "Albert Barnes", installed: false, loading: false },
        { id: "gill", name: "John Gill's Exposition", installed: false, loading: false },
        { id: "calvin", name: "John Calvin's Commentary", installed: false, loading: false },
        { id: "spurgeon", name: "Charles Spurgeon", installed: false, loading: false },
        { id: "luterom", name: "Luterom", installed: false, loading: false },
      ]
    },
    {
      id: "maps",
      name: "Mapas",
      icon: MapPin,
      description: "Mapas e atlas bíblicos",
      modules: [
        { id: "holman_atlas", name: "Holman Bible Atlas", installed: false, loading: false },
        { id: "bible_geo", name: "Bible Geography", installed: false, loading: false },
        { id: "time_table", name: "Timeline Biblical", installed: false, loading: false },
      ]
    },
    {
      id: "people",
      name: "Personagens",
      icon: Users,
      description: "Banco de dados de personagens bíblicos",
      modules: [
        { id: "people_nt", name: "Personagens do NT", installed: false, loading: false },
        { id: "people_ot", name: "Personagens do AT", installed: false, loading: false },
        { id: "women_bible", name: "Mulheres da Biblia", installed: false, loading: false },
      ]
    },
  ];

  const [modules, setModules] = useState(categories);

  const handleInstall = async (categoryId: string, moduleId: string) => {
    setModules(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          modules: cat.modules.map(mod => 
            mod.id === moduleId ? { ...mod, loading: true } : mod
          )
        };
      }
      return cat;
    }));

    // Simular download (em produção, isso chamaria uma API)
    await new Promise(resolve => setTimeout(resolve, 2000));

    setModules(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          modules: cat.modules.map(mod => 
            mod.id === moduleId ? { ...mod, loading: false, installed: true, version: "1.0" } : mod
          )
        };
      }
      return cat;
    }));
  };

  const handleUninstall = (categoryId: string, moduleId: string) => {
    setModules(prev => prev.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          modules: cat.modules.map(mod => 
            mod.id === moduleId ? { ...mod, installed: false, version: undefined } : mod
          )
        };
      }
      return cat;
    }));
  };

  const installedCount = modules.reduce((acc, cat) => 
    acc + cat.modules.filter(m => m.installed).length, 0
  );
  const totalCount = modules.reduce((acc, cat) => acc + cat.modules.length, 0);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Gerenciador de Módulos
            </CardTitle>
            <CardDescription>
              Instale e gerencie módulos bíblicos estilo TheWord
            </CardDescription>
          </div>
          <Badge variant="outline">
            {installedCount}/{totalCount} instalados
          </Badge>
        </div>
        <Progress value={(installedCount / totalCount) * 100} className="mt-2" />
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 lg:grid-cols-7 h-auto p-1">
            {modules.map(cat => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="flex flex-col gap-1 py-2 px-1"
              >
                <cat.icon className="w-4 h-4" />
                <span className="text-[10px]">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {modules.map(cat => (
            <TabsContent key={cat.id} value={cat.id} className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <cat.icon className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold">{cat.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{cat.description}</p>
                <Separator />
                
                <div className="grid gap-2">
                  {cat.modules.map(mod => (
                    <div 
                      key={mod.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                        mod.installed 
                          ? "bg-primary/5 border-primary/20" 
                          : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          mod.installed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          <mod.installed ? <Star className="w-4 h-4" /> : <cat.icon className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{mod.name}</p>
                          {mod.version && (
                            <p className="text-xs text-muted-foreground">v{mod.version}</p>
                          )}
                        </div>
                      </div>
                      
                      {mod.loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-muted-foreground">Instalando...</span>
                        </div>
                      ) : mod.installed ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleUninstall(cat.id, mod.id)}
                        >
                          Desinstalar
                        </Button>
                      ) : (
                        <Button 
                          size="sm"
                          onClick={() => handleInstall(cat.id, mod.id)}
                        >
                          Instalar
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ModuleManager;

// Ícone temporário até importar
const Hash = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <line x1="4" x2="20" y1="9" y2="9" />
    <line x1="4" x2="20" y1="15" y2="15" />
    <line x1="10" x2="8" y1="3" y2="21" />
    <line x1="16" x2="14" y1="3" y2="21" />
  </svg>
);

export { Hash };