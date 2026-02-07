import * as fabric from 'fabric';

export type TemplateDef = {
  id: string;
  name: string;
  description: string;
  build: () => fabric.FabricObject[];
};

const STROKE = '#0f172a';
const FILL = '#ffffff';
const FILL_DARK = '#111827';

/** Cria objetos Fabric e retorna a lista para adicionar ao canvas */
export const TEMPLATES: TemplateDef[] = [
  {
    id: 'flow-basic',
    name: 'Fluxograma (básico)',
    description: 'Início → Processo → Decisão → Fim',
    build: () => {
      const objs: fabric.FabricObject[] = [];
      const addRect = (left: number, top: number, w: number, h: number) => {
        const r = new fabric.Rect({ left, top, width: w, height: h, rx: 10, ry: 10, fill: FILL, stroke: STROKE, strokeWidth: 2 });
        objs.push(r);
      };
      const addText = (left: number, top: number, text: string) => {
        const t = new fabric.Textbox(text, { left, top, width: 160, fontSize: 18, fill: FILL_DARK, selectable: true });
        objs.push(t);
      };
      const addLine = (left: number, top: number, dy: number) => {
        const ln = new fabric.Line([0, 0, 0, dy], { left, top, stroke: STROKE, strokeWidth: 2 });
        objs.push(ln);
      };
      const addDiamond = (left: number, top: number) => {
        const p = new fabric.Polygon(
          [{ x: 60, y: 0 }, { x: 120, y: 50 }, { x: 60, y: 100 }, { x: 0, y: 50 }],
          { left, top, fill: FILL, stroke: STROKE, strokeWidth: 2 }
        );
        objs.push(p);
      };

      addRect(120, 120, 120, 60);
      addText(145, 138, 'Início');
      addLine(180, 180, 50);
      addRect(120, 230, 200, 70);
      addText(145, 252, 'Processo');
      addLine(180, 300, 40);
      addDiamond(140, 340);
      addText(155, 368, 'Decisão');
      addLine(180, 440, 40);
      addRect(120, 480, 120, 60);
      addText(150, 498, 'Fim');
      return objs;
    },
  },
  {
    id: 'brainstorm',
    name: 'Brainstorming',
    description: 'Post-its para ideias rápidas',
    build: () => {
      const objs: fabric.FabricObject[] = [];
      for (let i = 0; i < 6; i++) {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const r = new fabric.Rect({
          left: 80 + col * 180,
          top: 120 + row * 140,
          width: 150,
          height: 110,
          fill: '#fff7ed',
          stroke: '#fb923c',
          strokeWidth: 2,
          rx: 14,
          ry: 14,
        });
        objs.push(r);
      }
      return objs;
    },
  },
  {
    id: 'arch-diagram',
    name: 'Diagrama de Arquitetura',
    description: 'Blocos Frontend → API → DB',
    build: () => {
      const objs: fabric.FabricObject[] = [];
      const addBlock = (left: number, top: number, label: string) => {
        const w = label.length > 10 ? 220 : 180;
        const r = new fabric.Rect({ left, top, width: w, height: 80, rx: 16, ry: 16, fill: FILL, stroke: STROKE, strokeWidth: 2 });
        const t = new fabric.Textbox(label, { left: left + 20, top: top + 25, width: w - 40, fontSize: 18, fill: FILL_DARK });
        objs.push(r, t);
      };
      const addArrow = (left: number, top: number, dx: number) => {
        const ln = new fabric.Line([0, 0, dx, 0], { left, top, stroke: STROKE, strokeWidth: 2 });
        objs.push(ln);
      };
      addBlock(90, 120, 'Frontend');
      addArrow(280, 160, 80);
      addBlock(370, 120, 'API');
      addArrow(560, 160, 90);
      addBlock(660, 120, 'DB/Cache');
      return objs;
    },
  },
  {
    id: 'roadmap',
    name: 'Roadmap',
    description: 'Linha do tempo com 3 marcos',
    build: () => {
      const objs: fabric.FabricObject[] = [];
      const line = new fabric.Line([0, 0, 600, 0], { left: 120, top: 220, stroke: STROKE, strokeWidth: 3 });
      objs.push(line);
      const colors = ['#0ea5e9', '#10b981', '#f59e0b'];
      const labels = ['Marco 1', 'Marco 2', 'Marco 3'];
      const positions = [200, 420, 720];
      positions.forEach((x, i) => {
        const c = new fabric.Circle({ left: x - 8, top: 212, radius: 10, fill: colors[i] ?? '#0ea5e9' });
        const t = new fabric.Textbox(labels[i] ?? 'Marco', { left: x - 60, top: 240, width: 120, fontSize: 16, fill: FILL_DARK });
        objs.push(c, t);
      });
      return objs;
    },
  },
  {
    id: 'kanban',
    name: 'Kanban (3 colunas)',
    description: 'To Do | Em progresso | Concluído',
    build: () => {
      const objs: fabric.FabricObject[] = [];
      const cols = ['To Do', 'Em progresso', 'Concluído'];
      const fills = ['#eff6ff', '#fef3c7', '#ecfdf5'];
      const strokes = ['#3b82f6', '#f59e0b', '#10b981'];
      cols.forEach((title, i) => {
        const x = 80 + i * 280;
        const r = new fabric.Rect({
          left: x,
          top: 100,
          width: 240,
          height: 400,
          rx: 12,
          ry: 12,
          fill: fills[i],
          stroke: strokes[i],
          strokeWidth: 2,
        });
        const t = new fabric.Textbox(title, {
          left: x + 20,
          top: 120,
          width: 200,
          fontSize: 18,
          fontWeight: 'bold',
          fill: FILL_DARK,
        });
        objs.push(r, t);
      });
      return objs;
    },
  },
  {
    id: 'organograma',
    name: 'Organograma',
    description: 'Estrutura hierárquica simples',
    build: () => {
      const objs: fabric.FabricObject[] = [];
      const addBox = (left: number, top: number, w: number, h: number, text: string) => {
        const r = new fabric.Rect({ left, top, width: w, height: h, rx: 8, ry: 8, fill: FILL, stroke: STROKE, strokeWidth: 2 });
        const t = new fabric.Textbox(text, { left: left + 10, top: top + 12, width: w - 20, fontSize: 14, fill: FILL_DARK });
        objs.push(r, t);
      };
      const addConnector = (x1: number, y1: number, x2: number, y2: number) => {
        const ln = new fabric.Line([0, 0, x2 - x1, y2 - y1], { left: x1, top: y1, stroke: STROKE, strokeWidth: 1 });
        objs.push(ln);
      };
      addBox(280, 80, 160, 50, 'Direção');
      addConnector(360, 130, 200, 200);
      addConnector(360, 130, 360, 200);
      addConnector(360, 130, 520, 200);
      addBox(120, 200, 160, 50, 'Área A');
      addBox(300, 200, 120, 50, 'Área B');
      addBox(440, 200, 160, 50, 'Área C');
      return objs;
    },
  },
];
