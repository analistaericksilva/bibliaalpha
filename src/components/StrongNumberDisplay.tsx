import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Search, BookOpen, Languages, Info, ExternalLink } from "lucide-react";
import bibleAPI, { StrongNumber, DictionaryDefinition } from "@/services/bibleAPI";
import { cn } from "@/lib/utils";

interface StrongNumberDisplayProps {
  strongNumber: string;
  className?: string;
}

const StrongNumberDisplay = ({ strongNumber, className }: StrongNumberDisplayProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [strongData, setStrongData] = useState<StrongNumber | null>(null);
  const [definitions, setDefinitions] = useState<DictionaryDefinition[]>([]);

  useEffect(() => {
    if (isOpen && strongNumber) {
      setIsLoading(true);
      
      Promise.all([
        bibleAPI.getStrongNumber(strongNumber),
        bibleAPI.lookupWord(strongNumber)
      ]).then(([strong, defs]) => {
        setStrongData(strong);
        setDefinitions(defs);
        setIsLoading(false);
      });
    }
  }, [isOpen, strongNumber]);

  const language = strongNumber.match(/^[0-9]+[A-Z]?$/, ) ? (parseInt(strongNumber) < 6000 ? "hebrew" : "greek") : "hebrew";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <sup 
          className={cn(
            "cursor-pointer text-[0.65em] font-bold text-blue-600 hover:text-blue-800 hover:underline",
            className
          )}
        >
          {strongNumber}
        </sup>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Card className="border-2 border-blue-200 shadow-lg">
          <CardHeader className="pb-2 bg-blue-50 dark:bg-blue-950">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  language === "hebrew" ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
                )}>
                  {strongNumber}
                </span>
                {strongData?.transliteration && (
                  <span className="text-lg font-serif">{strongData.transliteration}</span>
                )}
              </CardTitle>
              <Badge variant={language === "hebrew" ? "default" : "secondary"}>
                {language === "hebrew" ? "Hebreu" : "Grego"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <Tabs defaultValue="definition" className="w-full">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="definition" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Definição
                  </TabsTrigger>
                  <TabsTrigger value="morphology" className="text-xs">
                    <Languages className="w-3 h-3 mr-1" />
                    Morfologia
                  </TabsTrigger>
                  <TabsTrigger value="related" className="text-xs">
                    <Search className="w-3 h-3 mr-1" />
                    Ver também
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="definition" className="p-3 space-y-3">
                  {strongData ? (
                    <>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Definição:</p>
                        <p className="text-sm">{strongData.definition}</p>
                      </div>
                      {strongData.part_of_speech && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Classe:</p>
                          <Badge variant="outline">{strongData.part_of_speech}</Badge>
                        </div>
                      )}
                      {strongData.pronunciation && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Pronúncia:</p>
                          <p className="text-sm italic">{strongData.pronunciation}</p>
                        </div>
                      )}
                    </>
                  ) : definitions.length > 0 ? (
                    <div className="space-y-2">
                      {definitions.map((def) => (
                        <div key={def.id} className="p-2 rounded bg-muted/50">
                          <p className="font-medium text-sm">{def.term}</p>
                          <p className="text-xs text-muted-foreground">{def.definition}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Número Strong não encontrado</p>
                      <p className="text-xs">Dados ainda não importados</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="morphology" className="p-3">
                  {strongData ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 rounded bg-muted/50">
                        <span className="text-xs">Idioma</span>
                        <Badge>{language === "hebrew" ? "Hebreu (H)" : "Grego (G)"}</Badge>
                      </div>
                      {strongData.word_hebrew && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-xs text-muted-foreground">Palavra Hebraica</p>
                          <p className="text-lg font-serif">{strongData.word_hebrew}</p>
                        </div>
                      )}
                      {strongData.word_greek && (
                        <div className="p-2 rounded bg-muted/50">
                          <p className="text-xs text-muted-foreground">Palavra Grega</p>
                          <p className="text-lg font-serif">{strongData.word_greek}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Dados morfológicos não disponíveis</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="related" className="p-3">
                  {definitions.length > 0 ? (
                    <div className="space-y-2">
                      {definitions.map((def) => (
                        <button
                          key={def.id}
                          className="w-full text-left p-2 rounded hover:bg-muted transition-colors flex items-center gap-2"
                        >
                          <ExternalLink className="w-3 h-3 text-muted-foreground" />
                          <span className="text-sm">{def.term}</span>
                          {def.strong_number && (
                            <Badge variant="outline" className="text-xs">
                              {def.strong_number}
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Nenhuma referência relacionada</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default StrongNumberDisplay;
export { StrongNumberDisplay };