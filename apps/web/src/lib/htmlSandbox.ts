'use client';

import type { RunOptions, SandboxResult, TestResult } from '@senatic/shared';

const DEFAULT_TIMEOUT_MS = 6000;
const REACT_TIMEOUT_MS  = 10000; // Babel standalone + render necesitan más tiempo

// ─── React scaffold ───────────────────────────────────────────────────────────
//
// Envuelve el código JSX del estudiante en un documento HTML completo que:
//  1. Carga @babel/standalone + React + ReactDOM desde unpkg
//  2. Expone los hooks más usados como globales (sin `import`)
//  3. Usa ReactDOM.flushSync() para que el render sea síncrono y los tests
//     encuentren el DOM ya pintado en el evento `message` de "ready"
//  4. Envía window.parent.postMessage('__react_ready__') cuando el árbol
//     está confirmado en el DOM — el sandbox lo espera antes de correr tests
//
// El estudiante solo escribe la función `App` (+ helpers si necesita).
// El scaffold maneja el bootstrapping completo.

export function buildReactScaffold(studentCode: string): string {
  // Escapamos la cadena para que no rompa el template si el estudiante
  // escribe algo como `</script>` dentro de su código.
  const safeCode = studentCode.replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://unpkg.com/@babel/standalone@7.23.9/babel.min.js"></script>
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; font-family: system-ui, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel" data-presets="react,env" data-plugins="transform-modules-umd">
    // Desestructuramos los hooks más comunes para que el estudiante los use
    // directamente sin necesidad de React.useState, React.useEffect, etc.
    const {
      useState, useEffect, useRef, useCallback, useMemo,
      useContext, createContext, useReducer, useId,
      Fragment,
    } = React;

    // container -> div#root (usado por los tests: container.querySelector)
    const container = document.getElementById('root');

    // root -> objeto con render() que el estudiante llama: root.render(<X />)
    // Interceptamos para envolver en flushSync y garantizar DOM pintado
    // antes de enviar el postMessage.
    const _reactRoot = ReactDOM.createRoot(container);
    let _renderCalled = false;
    const root = {
      render(element) {
        _renderCalled = true;
        ReactDOM.flushSync(() => {
          _reactRoot.render(element);
        });
      }
    };

    // ── Código del estudiante ──────────────────────────────────────────────
    ${safeCode}
    // ── Fin del código del estudiante ──────────────────────────────────────

    // Señal al sandbox: el DOM de React ya está listo para los tests.
    window.parent.postMessage('__react_ready__', '*');
  </script>
</body>
</html>`;
}

// ─── runHtmlSandbox ───────────────────────────────────────────────────────────

export function runHtmlSandbox(
  options: RunOptions & { exerciseType?: string },
  timeoutMs?: number,
): Promise<SandboxResult> {
  if (typeof document === 'undefined') {
    return Promise.reject(new Error('runHtmlSandbox solo está disponible en el navegador'));
  }

  const isReact = options.exerciseType === 'react';
  const effectiveTimeout = timeoutMs ?? (isReact ? REACT_TIMEOUT_MS : DEFAULT_TIMEOUT_MS);
  const clampedTimeout = Math.min(Math.max(effectiveTimeout, 500), 20000);

  // Para ejercicios React, transformamos el código en el scaffold completo.
  // Para HTML, lo usamos directamente (igual que antes).
  const srcdoc = isReact ? buildReactScaffold(options.code) : options.code;

  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.style.cssText =
      'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';

    document.body.appendChild(iframe);

    let settled = false;

    const timeoutResult: SandboxResult = {
      status: 'timeout',
      output: [],
      error: isReact
        ? 'Tiempo de espera agotado — comprueba que tu componente App no lanza errores'
        : 'Tiempo de espera agotado — el HTML puede estar malformado',
      testResults: options.tests.map((t) => ({
        description: t.description,
        passed: false,
      })),
    };

    const timeoutId = setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(timeoutResult);
    }, clampedTimeout);

    // ── Función común de evaluación de tests ─────────────────────────────

    function runTests(): SandboxResult {
      const testResults: TestResult[] = [];
      let evalError: string | null = null;

      try {
        const doc = iframe.contentDocument!;
        const win = iframe.contentWindow!;

        const container = doc.getElementById('root');

        for (const test of options.tests) {
          try {
            // eslint-disable-next-line no-new-func
            const fn = new Function('doc', 'win', 'container', `return Boolean(${test.expression});`);
            const passed = fn(doc, win, container) as boolean;
            testResults.push({ description: test.description, passed });
          } catch (e: unknown) {
            testResults.push({
              description: test.description,
              passed: false,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      } catch (e: unknown) {
        evalError = e instanceof Error ? e.message : String(e);
        for (const test of options.tests) {
          testResults.push({ description: test.description, passed: false });
        }
      }

      return {
        status: evalError ? 'error' : 'success',
        output: [],
        error: evalError,
        testResults,
      };
    }

    function cleanup() {
      window.removeEventListener('message', onMessage);
      iframe.remove();
    }

    // ── Ejercicios HTML: esperar onload (comportamiento original) ─────────

    if (!isReact) {
      iframe.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        const result = runTests();
        cleanup();
        resolve(result);
      };
      iframe.srcdoc = srcdoc;
      return;
    }

    // ── Ejercicios React: esperar postMessage '__react_ready__' ───────────
    //
    // El scaffold envía este mensaje DESPUÉS de flushSync(), garantizando
    // que el DOM de React está completamente pintado antes de los tests.

    function onMessage(event: MessageEvent) {
      if (event.data !== '__react_ready__') return;
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      const result = runTests();
      cleanup();
      resolve(result);
    }

    window.addEventListener('message', onMessage);
    iframe.srcdoc = srcdoc;
  });
}
