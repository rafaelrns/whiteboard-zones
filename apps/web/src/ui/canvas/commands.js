import { ArrowLine } from './ArrowLine';
/** Cria seta usando ArrowLine (classe customizada, sem Group) — evita duplicação e problemas de renderização */
export function makeArrow(from, to, type = 'simple') {
    return new ArrowLine([from.x, from.y, to.x, to.y], { arrowType: type });
}
