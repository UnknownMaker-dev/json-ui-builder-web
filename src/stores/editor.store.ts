import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UIElement {
  id: string;
  type: 'button' | 'panel' | 'label' | 'canvas' | 'stackPanel';
  name: string;
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
    text?: string;
    [key: string]: any;
  };
  children: UIElement[];
}

export const useEditorStore = defineStore('editor', () => {
  const elements = ref<UIElement[]>([])
  const selectedElementId = ref<string | null>(null)

  const selectedElement = computed(() => {
    const findElement = (nodes: UIElement[]): UIElement | undefined => {
      for (const node of nodes) {
        if (node.id === selectedElementId.value) return node;
        if (node.children.length > 0) {
          const found = findElement(node.children);
          if (found) return found;
        }
      }
    };
    return findElement(elements.value);
  })

  // Nova função de adicionar com valores padrão
  function addElement(type: UIElement['type'], name: string) {
    const newElement: UIElement = {
      id: crypto.randomUUID(), // Gera um ID único
      type,
      name,
      properties: {
        x: 50, // Posição inicial X
        y: 50, // Posição inicial Y
        width: type === 'panel' ? 200 : 100,
        height: type === 'panel' ? 200 : 40,
        text: type === 'label' || type === 'button' ? name : undefined
      },
      children: []
    }
    elements.value.push(newElement)
    // Seleciona o elemento recém-criado
    selectElement(newElement.id)
  }

  function selectElement(id: string | null) {
    selectedElementId.value = id
  }

  return { 
    elements, 
    selectedElementId, 
    selectedElement, 
    addElement, 
    selectElement 
  }
})
