import { describe, expect, it } from "vitest";
import { humanizeEs } from "./label-es";

describe("humanizeEs", () => {
  it("separa el camelCase y deja la primera en mayúscula", () => {
    expect(humanizeEs("elMapa")).toBe("El mapa");
    expect(humanizeEs("materialNuevo")).toBe("Material nuevo");
  });

  it("separa las cifras pegadas a una palabra", () => {
    expect(humanizeEs("razon1")).toBe("Razón 1");
    expect(humanizeEs("grado3")).toBe("Grado 3");
  });

  it("acentúa las palabras que lo llevan siempre", () => {
    expect(humanizeEs("duracion")).toBe("Duración");
    expect(humanizeEs("laTecnica")).toBe("La técnica");
    expect(humanizeEs("puas")).toBe("Púas");
    expect(humanizeEs("elMetronomo")).toBe("El metrónomo");
    expect(humanizeEs("primeraInversion")).toBe("Primera inversión");
    expect(humanizeEs("laDefinicionUtil")).toBe("La definición útil");
  });

  it("acentúa el interrogativo al principio", () => {
    expect(humanizeEs("queEs")).toBe("Qué es");
    expect(humanizeEs("comoSuena")).toBe("Cómo suena");
    expect(humanizeEs("dondeSuena")).toBe("Dónde suena");
    expect(humanizeEs("cuandoUsarlo")).toBe("Cuándo usarlo");
  });

  it("acentúa el interrogativo detrás de preposición", () => {
    expect(humanizeEs("paraQue")).toBe("Para qué");
    expect(humanizeEs("porQueImporta")).toBe("Por qué importa");
    expect(humanizeEs("conQue")).toBe("Con qué");
    expect(humanizeEs("aQueSuena")).toBe("A qué suena");
    expect(humanizeEs("sobreQue")).toBe("Sobre qué");
  });

  it("NO lo acentúa cuando es relativo, que es donde falla todo el mundo", () => {
    expect(humanizeEs("loQueCambia")).toBe("Lo que cambia");
    expect(humanizeEs("lasQueNoSuenan")).toBe("Las que no suenan");
    expect(humanizeEs("elQueDelata")).toBe("El que delata");
    expect(humanizeEs("loQueNadieDice")).toBe("Lo que nadie dice");
  });

  it("el caso mixto: relativo e interrogativo en la misma etiqueta", () => {
    expect(humanizeEs("loQueDiceLaTeoria")).toBe("Lo que dice la teoría");
    expect(humanizeEs("porQueSonFaciles")).toBe("Por qué son fáciles");
  });

  it("'está' del verbo, no 'esta' del demostrativo", () => {
    expect(humanizeEs("dondeEsta")).toBe("Dónde está");
    expect(humanizeEs("estaSemana")).toBe("Esta semana");
  });

  it("respeta lo que la RAE ya no acentúa", () => {
    expect(humanizeEs("elSoloLibre")).toBe("El solo libre");
    expect(humanizeEs("elGuion")).toBe("El guion");
  });

  it("no toca lo que no conoce", () => {
    expect(humanizeEs("elEnclosure")).toBe("El enclosure");
    expect(humanizeEs("hoySoloRodeas")).toBe("Hoy solo rodeas");
  });

  it("separa también las mayúsculas seguidas", () => {
    expect(humanizeEs("terceraYUltima")).toBe("Tercera y última");
    expect(humanizeEs("deBluesAJazz")).toBe("De blues a jazz");
  });

  it("acentúa toda la familia -ción / -sión sin listarlas una a una", () => {
    expect(humanizeEs("laSolucion")).toBe("La solución");
    expect(humanizeEs("laTranscripcion")).toBe("La transcripción");
    expect(humanizeEs("laDecision")).toBe("La decisión");
    expect(humanizeEs("laDistorsion")).toBe("La distorsión");
  });

  it("los plurales de -ción no llevan tilde", () => {
    expect(humanizeEs("lasCanciones")).toBe("Las canciones");
    expect(humanizeEs("dosOrdenaciones")).toBe("Dos ordenaciones");
  });

  it("respeta el cifrado y las notas en mayúscula", () => {
    expect(humanizeEs("sobreC")).toBe("Sobre C");
    expect(humanizeEs("sobreAm")).toBe("Sobre Am");
    expect(humanizeEs("seccionA")).toBe("Sección A");
    expect(humanizeEs("m7b5")).toBe("m7b5");
    expect(humanizeEs("maj7")).toBe("maj7");
    expect(humanizeEs("sus4")).toBe("sus4");
  });

  it("respeta los grados en números romanos", () => {
    expect(humanizeEs("elI")).toBe("El I");
    expect(humanizeEs("elV")).toBe("El V");
    expect(humanizeEs("elIV")).toBe("El IV");
  });

  it("la eñe también", () => {
    expect(humanizeEs("elTamano")).toBe("El tamaño");
    expect(humanizeEs("laMuneca")).toBe("La muñeca");
    expect(humanizeEs("laSenal")).toBe("La señal");
  });

  it("los modos y el vocabulario del mástil", () => {
    expect(humanizeEs("elMastil")).toBe("El mástil");
    expect(humanizeEs("modoDorico")).toBe("Modo dórico");
    expect(humanizeEs("laTriada")).toBe("La tríada");
    expect(humanizeEs("elAngulo")).toBe("El ángulo");
  });
});
