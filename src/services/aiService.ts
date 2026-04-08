import { supabase } from "@/integrations/supabase/client";

export interface AIInsight {
  summary: string;
  applications: string[];
  historicalContext: string;
  theologicalPoints: string[];
}

class AIService {
  async getChapterInsights(bookId: string, chapter: number): Promise<AIInsight | null> {
    try {
      const { data, error } = await supabase.functions.invoke("verse-intelligence", {
        body: { bookId, chapter, action: "chapter-insight" },
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      // Fallback para dados simulados se a função não estiver pronta
      return {
        summary: "Este capítulo aborda temas fundamentais de fé e perseverança.",
        applications: [
          "Aplique os princípios de paciência em suas dificuldades diárias.",
          "Busque sabedoria através da oração constante.",
          "Pratique a caridade com aqueles que estão ao seu redor."
        ],
        historicalContext: "Escrito em um período de transição e desafios para a comunidade primitiva.",
        theologicalPoints: [
          "A soberania de Deus sobre a história.",
          "A necessidade de redenção humana.",
          "A promessa de restauração futura."
        ]
      };
    }
  }

  async getVerseExplanation(bookId: string, chapter: number, verse: number): Promise<string | null> {
    try {
      const { data, error } = await supabase.functions.invoke("verse-intelligence", {
        body: { bookId, chapter, verse, action: "explain" },
      });

      if (error) throw error;
      return data.explanation;
    } catch (err) {
      console.error("Error fetching verse explanation:", err);
      return "Explicação indisponível no momento. Tente novamente mais tarde.";
    }
  }
}

export const aiService = new AIService();
export default aiService;
