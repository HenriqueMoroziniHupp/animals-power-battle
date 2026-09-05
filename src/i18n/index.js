import { LOCALES } from './locales.js'

const STORAGE_KEY = 'animal_battle_lang'

let currentLanguage = 'pt'
const changeListeners = new Set()

/**
 * Detecta o idioma preferido:
 * 1. Preferência salva no localStorage
 * 2. Idioma do navegador (se começar com 'pt' -> 'pt', caso contrário 'en')
 */
export function detectLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'pt' || saved === 'en') return saved
  } catch (_) {}

  const browserLang = (
    navigator.language ||
    navigator.languages?.[0] ||
    navigator.userLanguage ||
    'en'
  ).toLowerCase()

  return browserLang.startsWith('pt') ? 'pt' : 'en'
}

/**
 * Retorna o idioma atualmente ativo ('pt' ou 'en').
 */
export function getLanguage() {
  return currentLanguage
}

/**
 * Traduz uma chave com suporte a caminhos aninhados e interpolação.
 * Ex: t('start.tagline') ou t('start.progressHint', { level: 5 })
 *
 * @param {string} key Caminho da chave (ex: 'start.play')
 * @param {Record<string, any>} [params] Parâmetros de interpolação
 * @returns {string} Texto traduzido
 */
export function t(key, params) {
  const dict = LOCALES[currentLanguage] || LOCALES.pt
  const fallbackDict = LOCALES.en || LOCALES.pt

  let val = resolveKey(dict, key)
  if (val === undefined) {
    val = resolveKey(fallbackDict, key)
  }
  if (val === undefined) {
    return key
  }

  if (params && typeof val === 'string') {
    for (const [k, v] of Object.entries(params)) {
      val = val.replaceAll(`{${k}}`, String(v))
    }
  }

  return val
}

function resolveKey(obj, path) {
  if (!obj) return undefined
  const parts = path.split('.')
  let cur = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = cur[p]
  }
  return cur
}

function hasTranslation(str) {
  return typeof str === 'string' && (str.includes("t('") || str.includes('t("'))
}

function applyTranslation(str) {
  return str.replace(/t\(['"]([^'"]+)['"]\)/g, (_, k) => t(k))
}

/**
 * Percorre o DOM e traduz todas as ocorrências inline de t('chave').
 * Preserva o template original para permitir alternar idiomas a quente.
 *
 * @param {HTMLElement} [root=document.body]
 */
export function translateDOM(root = document.body) {
  if (!root) return

  // 1. Atualiza lang do documento
  document.documentElement.lang = currentLanguage === 'pt' ? 'pt-BR' : 'en'

  // 2. Elementos com filho único de texto (permite tags HTML como <b> e &middot;)
  const allElements = root.querySelectorAll('*')
  for (const el of allElements) {
    // Se o elemento possui apenas um nó filho de texto
    if (el.childNodes.length === 1 && el.firstChild.nodeType === Node.TEXT_NODE) {
      const textNode = el.firstChild
      if (!el._i18nRaw && hasTranslation(textNode.nodeValue)) {
        el._i18nRaw = textNode.nodeValue
      }
      if (el._i18nRaw) {
        const replaced = applyTranslation(el._i18nRaw)
        if (replaced.includes('<') || replaced.includes('&')) {
          el.innerHTML = replaced
        } else {
          textNode.nodeValue = replaced
        }
      }
    }

    // 3. Traduz atributos (title, aria-label, alt, etc.)
    for (const attr of el.attributes) {
      if (!attr._i18nRaw && hasTranslation(attr.value)) {
        attr._i18nRaw = attr.value
      }
      if (attr._i18nRaw) {
        attr.value = applyTranslation(attr._i18nRaw)
      }
    }
  }

  // 4. Nós de texto avulsos / com múltiplos irmãos (ex: <button>t('menu.sound') <b>ON</b></button>)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null)
  let node
  while ((node = walker.nextNode())) {
    // Pula se já foi traduzido como filho único pelo pai acima
    if (node.parentElement && node.parentElement._i18nRaw) continue

    if (!node._i18nRaw && hasTranslation(node.nodeValue)) {
      node._i18nRaw = node.nodeValue
    }
    if (node._i18nRaw) {
      node.nodeValue = applyTranslation(node._i18nRaw)
    }
  }
}

/**
 * Altera o idioma ativo, atualiza o DOM e notifica ouvintes registrados.
 * @param {'pt' | 'en'} lang
 */
export function setLanguage(lang) {
  if (lang !== 'pt' && lang !== 'en') return
  currentLanguage = lang
  try {
    localStorage.setItem(STORAGE_KEY, lang)
  } catch (_) {}

  translateDOM()

  for (const listener of changeListeners) {
    try {
      listener(currentLanguage)
    } catch (e) {
      console.error('[i18n] listener error:', e)
    }
  }
}

/**
 * Registra um callback disparado ao mudar de idioma.
 * @param {(lang: string) => void} listener
 * @returns {() => void} Função para remover o listener
 */
export function onLanguageChange(listener) {
  changeListeners.add(listener)
  return () => changeListeners.delete(listener)
}

/**
 * Inicializa o i18n na carga da página.
 */
export function initI18n() {
  currentLanguage = detectLanguage()
  translateDOM()
  return currentLanguage
}
