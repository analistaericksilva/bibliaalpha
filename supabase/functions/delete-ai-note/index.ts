import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { note_id } = await req.json();

    if (!note_id) {
      return new Response(
        JSON.stringify({ error: "note_id é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: note, error: fetchError } = await supabase
      .from("study_notes")
      .select("source, created_by")
      .eq("id", note_id)
      .single();

    if (fetchError || !note) {
      return new Response(
        JSON.stringify({ error: "Nota não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const protectedSources = [
      'Tomás de Aquino','Anselmo de Cantuária','Bernardo de Claraval',
      'Martinho Lutero','João Calvino','Ulrich Zwingli','John Knox','Martin Bucer','Heinrich Bullinger','Theodore Beza',
      'Jonathan Edwards','John Owen','Richard Baxter','Thomas Watson','John Flavel','Stephen Charnock','Thomas Goodwin','William Perkins','William Gurnall','Thomas Boston','John Brown of Haddington',
      'John Wesley','George Whitefield','Charles Finney','Dwight L. Moody','R. A. Torrey',
      'Charles Hodge','A. A. Hodge','Charles Spurgeon','Andrew Murray','E. M. Bounds','F. B. Meyer','Alexander Maclaren','B. B. Warfield','Louis Berkhof','Herman Bavinck',
      'Albert Barnes','Adam Clarke','John Gill','Jamieson-Fausset-Brown','Joseph Benson','Octavius Winslow',
      'Agostinho de Hipona','João Crisóstomo','Jerônimo','Orígenes','Atanásio','Atanásio de Alexandria',
      'Gregório de Nissa','Basílio de Cesareia','Tertuliano','Ireneu de Lyon','Clemente de Roma','Policarpo de Esmirna'
    ];

    const isProtected = note.source && protectedSources.includes(note.source);

    if (isProtected) {
      return new Response(
        JSON.stringify({ error: "Notas de teólogos históricos não podem ser excluídas" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: deleteError } = await supabase
      .from("study_notes")
      .delete()
      .eq("id", note_id);

    if (deleteError) {
      return new Response(
        JSON.stringify({ error: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Nota excluída com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
