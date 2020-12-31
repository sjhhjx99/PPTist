import { Node, NodeType, ResolvedPos } from 'prosemirror-model'
import { EditorState, Selection } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'

const equalNodeType = (nodeType: NodeType, node: Node) => {
  return Array.isArray(nodeType) && nodeType.indexOf(node.type) > -1 || node.type === nodeType
}

const findParentNodeClosestToPos = ($pos: ResolvedPos, predicate: (node: Node) => boolean) => {
  for(let i = $pos.depth; i > 0; i--) {
    const node = $pos.node(i)
    if(predicate(node)) {
      return {
        pos: i > 0 ? $pos.before(i) : 0,
        start: $pos.start(i),
        depth: i,
        node,
      }
    }
  }
}

export const findParentNode = (predicate: (node: Node) => boolean) => {
  return (_ref: Selection) => findParentNodeClosestToPos(_ref.$from, predicate)
}

export const findParentNodeOfType = (nodeType: NodeType) => {
  return (selection: Selection) => {
    return findParentNode((node: Node) => {
      return equalNodeType(nodeType, node)
    })(selection)
  }
}

export const isActiveOfParentNodeType = (nodeType: string, state: EditorState) => {
  const node = state.schema.nodes[nodeType]
  return !!findParentNodeOfType(node)(state.selection)
}

export const getMarkAttrs = (view: EditorView) => {
  const { selection, doc } = view.state
  const { from } = selection
  const node = doc.nodeAt(from)
  return node?.marks || []
}

export const getAttrValue = (view: EditorView, markType: string, attr: string) => {
  const marks = getMarkAttrs(view)
  for(const mark of marks) {
    if(mark.type.name === markType && mark.attrs[attr]) return mark.attrs[attr]
  }
  return null
}

export const isActiveMark = (view: EditorView, markType: string) => {
  const marks = getMarkAttrs(view)
  for(const mark of marks) {
    if(mark.type.name === markType) return true
  }
  return false
}

export const getAttrValueInSelection = (view: EditorView, attr: string) => {
  const { selection, doc } = view.state
  const { from, to } = selection

  let keepChecking = true
  let value = ''
  doc.nodesBetween(from, to, node => {
    if(keepChecking && node.attrs[attr]) {
      keepChecking = false
      value = node.attrs[attr]
    }
    return keepChecking
  })
  return value
}