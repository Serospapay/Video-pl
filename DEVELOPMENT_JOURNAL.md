# DPFah Video Player

## Короткий опис проєкту

Це десктопний відеоплеєр для тих, хто хоче дивитися фільми та серіали локально без зайвих функцій і реклами. Замість того щоб розкидати файли по папках і відкривати їх у системному плеєрі, можна зібрати плейлист, перетягнути відео в одне вікно і керувати відтворенням з клавіатури — як у серйозних плеєрів. Плеєр пам’ятає, де ти зупинився, підтримує субтитри в SRT, дозволяє робити скріншоти кадру і працює в режимі PiP поверх інших вікон.

## Стек технологій

- **React 19** — обрали саме його, бо це актуальний стек для UI, а новий композер дає зручну роботу з формою та станом без зайвих абстракцій.
- **TypeScript (strict)** — щоб під час розробки ловити помилки типів і мати підказки замість "згадай, що тут передається".
- **Vite** — швидкий dev-сервер і збірка без налаштування Webpack; для такого проєкту це оптимальний варіант.
- **Electron** — потрібен доступ до файлової системи (відкрити/зберегти файл, безпечно відтворювати локальні шляхи), тому веб-версія сама по собі не підходила.
- **Framer Motion** — для плавних появлень/зникнень елементів інтерфейсу без написання купи CSS-анімацій вручну.
- **Lucide React** — набір іконок в єдиному стилі, легкий і без зайвих залежностей.
- **electron-log** — логування в Electron у файл, щоб у продакшені можна було розбиратися з помилками.
- **Vitest** — юніт-тести для утиліт (парсер субтитрів, робота з шляхами, історія переглядів) без піднімання всього React і Electron.
- **localStorage** — для збереження плейлиста, гучності, швидкості та режимів; Redux або глобальний стор були б надлишковими для цих задач.

## Архітектура

Додаток побудований як один головний React-компонент (`App`), який тримає плейлист і поточний індекс. Відтворенням відео займається компонент `Player`: він отримує `src`, підписується на події відео і використовує два хуки — `useVideoControls` (відтворення, гучність, fullscreen, seek) та `useKeyboardShortcuts` (клавіатура). Логіка "наступне/попереднє", loop і shuffle живе в `App`, щоб не роздувати плеєр. Утиліти (парсер SRT, робота з файлами, історія переглядів, скріншоти) винесені в окремі модулі і покриті тестами. Electron відповідає за вікно без рамки, діалоги відкриття/збереження файлів і безпечний протокол `media://` для локальних відео.

## Структура проєкту

```
Video/
├── electron/                 # Процес Electron
│   ├── main.ts               # Точка входу, створення вікна, IPC, протокол media://
│   └── preload.ts            # Мост між renderer і main (openFile, saveScreenshot)
├── src/
│   ├── components/
│   │   ├── TitleBar/         # Кастомний заголовок вікна (minimize, maximize, close)
│   │   ├── Player/           # Відео, контроли, субтитри, A-B repeat, PiP, скріншот
│   │   │   ├── Player.tsx
│   │   │   ├── VideoDisplay.tsx
│   │   │   ├── Controls.tsx
│   │   │   └── Player.css
│   │   └── Playlist/         # Список треків, прогреси, loop/shuffle, очистка
│   ├── hooks/
│   │   ├── useVideoControls.ts   # Стан і дії плеєра (play, seek, volume, fullscreen)
│   │   └── useKeyboardShortcuts.ts  # Глобальні гарячі клавіші з ігноруванням input/textarea
│   ├── utils/
│   │   ├── storage.ts        # Типізований save/load у localStorage
│   │   ├── constants.ts     # Ключі стореджа, кроки seek/volume, шорткати
│   │   ├── fileUtils.ts     # pathToFileUrl, isVideoFile, валідація шляхів
│   │   ├── watchHistory.ts  # Збереження позиції та completed (95%)
│   │   ├── SubtitleParser.ts # Парсинг SRT у масив { startTime, endTime, text }
│   │   ├── screenshot.ts    # captureVideoFrame (canvas), saveScreenshot (Electron/fallback)
│   │   └── __tests__/       # Юніт-тести для утиліт
│   ├── App.tsx               # Корінь: плейлист, drag-drop, open file, next/prev/loop/shuffle
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── index.html
├── vite.config.ts
├── package.json
├── start.bat                 # Запуск dev:electron під Windows (тільки ASCII)
└── DEVELOPMENT_JOURNAL.md    # Цей документ
```

## Хронологія розробки

### Етап 1: Фундамент і оточення (Vite + Electron)

**Опис:** Спочатку потрібно було підняти проєкт так, щоб одночасно працювали Vite (React) і Electron, без ручного копіювання білдів. Обрали схему: Vite віддає фронт на localhost:5173, Electron після збірки `main.ts` чекає порт через `wait-on` і завантажує в вікно цей URL. У dev-режимі одразу видно зміни без перезапуску Electron. Окремий `tsconfig` для electron дозволяє збирати main/preload у CommonJS, тоді як фронт залишається ESM.

**Код:**

```json
// package.json (фрагмент scripts)
"ts:electron": "tsc -p electron/tsconfig.json && node -e \"require('fs').writeFileSync('dist-electron/package.json', '{\\\"type\\\": \\\"commonjs\\\"}')\"",
"electron": "npm run ts:electron && wait-on tcp:5173 && cross-env NODE_ENV=development electron .",
"dev:electron": "concurrently -k \"npm run dev\" \"npm run electron\"",
```

**Пояснення:** Тут ми явно пишемо `dist-electron/package.json` з `"type": "commonjs"`, бо збірник TypeScript для Electron виводить require/module.exports, а Node за замовчуванням очікує ESM у проєктах з "type": "module". Без цього кроку main.js падав би при запуску.

---

### Етап 2: Утиліти збереження стану (storage, constants)

**Опис:** Щоб не розкидати ключі localStorage по коду і мати типізоване читання/запис, зробили модуль `storage.ts` з двома функціями: `saveState` і `loadState`. Усі ключі винесли в `constants.ts` у об’єкт `STORAGE_KEYS` — так легше змінити ім’я ключа в одному місці і не зламати сумісність при рефакторингу.

**Код:**

```ts
// storage.ts
export const saveState = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save state for key "${key}":`, error);
  }
};
export const loadState = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to load state for key "${key}":`, error);
    return defaultValue;
  }
};
```

**Пояснення:** Дженерик `<T>` дає типізацію при читанні: `loadState(STORAGE_KEYS.PLAYLIST, [])` поверне `string[]`, а не `unknown`. У catch ми завжди повертаємо defaultValue, щоб зіпсований або старий формат даних не валив апку — користувач просто отримає дефолт.

---

### Етап 3: Ядро плеєра і хук useVideoControls

**Опис:** Потрібно було зробити не просто `<video>`, а повноцінне керування: play/pause, seek, гучність, mute, швидкість відтворення, fullscreen. Щоб не роздувати один компонент, винесли всю логіку в хук `useVideoControls`. Він тримає ref на `<video>`, синхронізує стан з елементом і зберігає гучність, mute та швидкість у localStorage.

**Код:**

```ts
// useVideoControls.ts (фрагмент)
const [volume, setVolume] = useState(() =>
  loadState(STORAGE_KEYS.PLAYER_VOLUME, DEFAULT_VOLUME)
);
// ...
useEffect(() => {
  if (videoRef.current) {
    videoRef.current.volume = volume;
    videoRef.current.muted = isMuted;
    videoRef.current.playbackRate = playbackRate;
  }
  saveState(STORAGE_KEYS.PLAYER_VOLUME, volume);
  saveState(STORAGE_KEYS.PLAYER_MUTED, isMuted);
  saveState(STORAGE_KEYS.PLAYER_SPEED, playbackRate);
}, [volume, isMuted, playbackRate]);
```

**Пояснення:** Ініціалізація стану через функцію в `useState(() => loadState(...))` дає один раз прочитати з localStorage при монтуванні, а не при кожному ре-рендері. Ефект одночасно підтягує значення в DOM і зберігає їх — єдине місце для і джерела правди (локальний стан), і персистенції.

---

### Етап 4: Стан плейлиста в App і персистенція

**Опис:** У App з’явився плейлист як масив URL-рядків і currentIndex. Плейлист, поточний індекс, loop і shuffle зберігаються в localStorage через `saveState`/`loadState`, щоб при наступному запуску користувач бачив ту саму чергу і режими. Логіку next/prev (з урахуванням shuffle і loop) залишили в App, щоб Player лишався тільки про відтворення одного src.

**Код:**

```ts
// App.tsx (фрагмент)
const [playlist, setPlaylist] = useState<string[]>(() =>
  loadState(STORAGE_KEYS.PLAYLIST, [])
);
const [currentIndex, setCurrentIndex] = useState<number>(() =>
  loadState(STORAGE_KEYS.CURRENT_INDEX, -1)
);
// ...
useEffect(() => {
  saveState(STORAGE_KEYS.PLAYLIST, playlist);
  saveState(STORAGE_KEYS.CURRENT_INDEX, currentIndex);
  saveState(STORAGE_KEYS.IS_LOOPING, isLooping);
  saveState(STORAGE_KEYS.IS_SHUFFLING, isShuffling);
}, [playlist, currentIndex, isLooping, isShuffling]);
```

**Пояснення:** Глобальний стор не використовуємо навмисно: стану не так багато, він живе в одному дереві компонентів, а persistence — один useEffect. Код залишається простим і передбачуваним.

---

### Етап 5: Відкриття файлів через Electron (IPC)

**Опис:** Користувач має мати можливість вибрати відео з диска через діалог. У main-процесі зареєстрували IPC handle `open-file`: показуємо системний Open Dialog з фільтром по розширеннях відео, повертаємо один обраний шлях. У renderer викликаємо `window.electron.openFile()`, отриманий шлях перетворюємо на `media://` URL і додаємо в плейлист.

**Код:**

```ts
// electron/main.ts (фрагмент)
ipcMain.handle('open-file', async () => {
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Movies', extensions: ['mkv', 'avi', 'mp4', 'webm', 'mov', 'flv', 'wmv', 'm4v'] }]
    });
    if (canceled || !filePaths?.length) return null;
    return filePaths[0];
  } catch (error) {
    log.error('Error opening file:', error);
    return null;
  }
});
```

**Пояснення:** Повертаємо саме шлях (рядок), а не вміст файлу — відтворення піде через протокол `media://`, щоб не навантажувати пам’ять і дотримуватися безпеки (renderer не має прямого file system API).

---

### Етап 6: Робота з шляхами і drag-and-drop

**Опис:** Локальні шляхи з Electron (або з drag-and-drop, де у File є `path`) треба конвертувати в URL, який зможе відтворити наш протокол. Зробили `fileUtils`: `pathToFileUrl` перетворює шлях на `media://...`, `isVideoFile` перевіряє розширення, `isValidFilePath` відсікає небезпечні символи та `..`. У App при drop фільтруємо тільки відеофайли і для кожного будуємо URL або blob URL (fallback у веб-середовищі).

**Код:**

```ts
// fileUtils.ts (фрагмент)
export const pathToFileUrl = (path: string): string => {
  const normalizedPath = path.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const encodedPath = encodeURIComponent(normalizedPath);
  return `media://${encodedPath}`;
};
export const isValidFilePath = (path: string): boolean => {
  if (!path || typeof path !== 'string') return false;
  const suspiciousPatterns = [/\.\./, /[<>"|?*]/];
  return !suspiciousPatterns.some(pattern => pattern.test(path));
};
```

**Пояснення:** Кодування шляху в URL потрібне, бо в шляху можуть бути пробіли та не-ASCII символи. Валідація без `..` і заборонених символів захищає від path traversal, коли цей шлях потім розбиратиме main-процес.

---

### Етап 7: Клавіатурні шорткати (useKeyboardShortcuts)

**Опис:** Хотілося керувати плеєром з клавіатури: пробіл — play/pause, J/L — перемотка, стрілки — гучність, F — fullscreen, M — mute. Зробили хук `useKeyboardShortcuts`, який приймає об’єкт з опціональними колбеками і підписується на `keydown`. Важливо не спрацьовувати шорткати, коли користувач вводить текст у input або textarea — тому на початку обробника перевіряємо `e.target`.

**Код:**

```ts
// useKeyboardShortcuts.ts (фрагмент)
if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
  return;
}
const { code } = e;
const isIn = (keys: readonly string[]) => keys.includes(code);
if (isIn(KEYBOARD_SHORTCUTS.PLAY_PAUSE)) {
  e.preventDefault();
  current.onPlayPause?.();
}
```

**Пояснення:** Використовуємо `code`, а не `key`, щоб не залежати від розкладки клавіатури. Маппінг зібрано в `constants.ts`, тому додати або змінити шорткат можна в одному місці.

---

### Етап 8: UX контролів (авто-приховування, подвійний клік)

**Опис:** Під час перегляду екран не повинен бути захаращений панеллю керування. Зробили так: при русі миші показуємо контроли і запускаємо таймер; якщо відео грає і миша кілька секунд не рухалась — ховаємо панель. Подвійний клік по відео перемикає fullscreen. Крок таймауту винесли в constants (CONTROLS_HIDE_TIMEOUT), щоб можна було підлаштувати без рипання по компоненту.

**Код:**

```ts
// Player.tsx (фрагмент)
const handleMouseMove = () => {
  setShowControls(true);
  if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
  controlsTimeoutRef.current = setTimeout(() => {
    if (isPlaying) setShowControls(false);
  }, CONTROLS_HIDE_TIMEOUT);
};
const handleDoubleClick = useCallback(() => {
  toggleFullscreen();
}, [toggleFullscreen]);
```

**Пояснення:** Таймер зберігаємо в ref, щоб при кожному mousemove очищати попередній і ставити новий — інакше після першого ж руху миші контроли б ховались через N секунд навіть при активному русі. Ховаємо тільки коли `isPlaying`, щоб у паузи завжди були видимі кнопки.

---

### Етап 9: Парсер субтитрів SRT

**Опис:** Користувач завантажує .srt файл; треба розпарсити його в масив об’єктів з полями startTime, endTime, text. Парсер розбиває вміст на блоки (подвійний перенос рядка), з кожного блоку витягує таймкод у форматі HH:MM:SS,mmm і текст. Конвертацію часу в секунди винесли в окрему функцію; підтримали і кому, і крапку як роздільник мілісекунд.

**Код:**

```ts
// SubtitleParser.ts (фрагмент)
const [start, end] = timeString.split(' --> ');
if (start && end) {
  const startTime = timeStringToSeconds(start);
  const endTime = timeStringToSeconds(end);
  if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) return;
  subtitles.push({ id: lines[0].trim(), startTime, endTime, text: lines.slice(2).join('\n').trim() });
}
```

**Пояснення:** Валідація startTime/endTime і пропуск зіпсованих блоків дають стійкість до неідеальних SRT: один поганий рядок не ламає весь список. Поточний субтитр далі обчислюється в timeupdate по поточному currentTime.

---

### Етап 10: Історія переглядів (позиція і completed)

**Опис:** Для кожного відео (за URL) зберігаємо позицію перегляду, тривалість, час останнього перегляду і прапорець completed (позиція >= 95% тривалості). Збереження позиції робимо по інтервалу (наприклад, раз на 5 секунд), коли відео грає, щоб не спамити localStorage на кожному timeupdate. При відкритті того ж відео відновлюємо position з історії; якщо відео додивлено до кінця — скидаємо position у 0.

**Код:**

```ts
// watchHistory.ts (фрагмент)
const completed = position >= duration * 0.95;
history[videoPath] = {
  position: completed ? 0 : position,
  duration,
  lastWatched: Date.now(),
  completed,
};
saveState(WATCH_HISTORY_KEY, history);
```

**Пояснення:** Після "додивлення" до 95% скидаємо position у 0, щоб при наступному відкритті відео починалося з початку. Прапорець completed використовується в плейлисті для позначення переглянутих і для кнопки "очистити переглянуті".

---

### Етап 11: Скріншоти (canvas + IPC)

**Опис:** Поточний кадр відео малюємо на canvas через `drawImage(videoElement, ...)`, отримуємо data URL. У Electron викликаємо IPC `save-screenshot` з цим data URL і ім’ям файлу за замовчуванням (на основі назви відео та таймкоду); main показує Save Dialog і записує base64 у файл. Якщо Electron немає — fallback: програмне натискання на посилання з атрибутом download.

**Код:**

```ts
// screenshot.ts (фрагмент)
export const captureVideoFrame = (videoElement: HTMLVideoElement): string | null => {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
};
```

**Пояснення:** Canvas дає точний кадр у момент виклику; toDataURL('image/png') зручно передати в IPC як рядок. У main ми вирізаємо префікс data:image/... і пишемо Buffer.from(base64, 'base64') у файл.

---

### Етап 12: Протокол media:// і безпека шляхів

**Опис:** У Electron додали кастомний протокол `media://`, щоб передавати в renderer не "сирий" file:// (з обмеженнями безпеки), а контрольований URL. Обробник приймає шлях з URL, декодує, перевіряє через `isSafeMediaPath` (абсолютний шлях, без `..`, дозволене розширення) і віддає вміст через `net.fetch(pathToFileURL(...))`. Якщо перевірка не пройдена — повертаємо `about:blank`.

**Код:**

```ts
// electron/main.ts (фрагмент)
protocol.handle('media', (request) => {
  const rawPath = request.url.slice('media://'.length);
  const decodedPath = decodeURIComponent(rawPath);
  if (!isSafeMediaPath(decodedPath)) {
    log.warn(`Blocked unsafe media request: ${request.url}`);
    return net.fetch('about:blank');
  }
  const fileUrl = url.pathToFileURL(decodedPath).toString();
  return net.fetch(fileUrl);
});
```

**Пояснення:** URL ніколи не довіряємо "як є": завжди нормалізуємо шлях, перевіряємо розширення і наявність `..`. Лог попередження допомагає пізніше зрозуміти спроби некоректного доступу.

---

### Етап 13: Кастомний titlebar

**Опис:** Вікно зроблено без системної рамки (frame: false), щоб інтерфейс виглядав однаково на різних ОС. Компонент TitleBar рендерить кнопки minimize, maximize/restore і close; по кліку викликає IPC (`minimize-window`, `maximize-window`, `close-window`). У main-процесі обробники викликають відповідні методи mainWindow.

**Код:**

```ts
// electron/main.ts (фрагмент)
ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.restore();
  else mainWindow?.maximize();
});
ipcMain.on('close-window', () => mainWindow?.close());
```

**Пояснення:** Усі дії з вікном виконуються в main-процесі — renderer лише надсилає сигнал. Так забезпечується коректна поведінка на macOS (закриття не завжди завершує апку) і однакова логіка для всіх платформ.

---

### Етап 14: Юніт-тести утиліт

**Опис:** Для модулів, які не залежать від DOM і Electron, написали юніт-тести (Vitest): парсер SRT (коректні та зіпсовані блоки, різні формати часу), fileUtils (getFileName, isVideoFile, pathToFileUrl, isValidFilePath), watchHistory (збереження позиції, отримання прогресу, прапорець completed). Це дає впевненість при зміні логіки парсиння або формату ключів у localStorage.

**Код:**

```ts
// Приклад: перевірка парсера SRT або watchHistory
// У __tests__/SubtitleParser.test.ts / watchHistory.test.ts
it('parses valid SRT block', () => {
  const data = '1\n00:00:01,000 --> 00:00:05,000\nHello';
  expect(parseSRT(data)).toHaveLength(1);
  expect(parseSRT(data)[0].startTime).toBe(1);
});
```

**Пояснення:** Тестуємо саме публічний API утиліт: парсер повертає масив з правильними полями, watchHistory коректно зберігає і читає з localStorage. Моки для localStorage у Vitest прості, тому тести швидкі і не потребують Electron.
