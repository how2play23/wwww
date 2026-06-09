# Arena AI Desktop

Десктоп-приложение для [Arena AI](https://arena.ai/) — удобная обёртка вместо браузера.

## Возможности

- Полноценный доступ к arena.ai в отдельном окне
- Панель навигации: назад, вперёд, обновить, главная
- Индикатор загрузки и адресная строка
- Горячие клавиши: `Ctrl+R`, `F5`, `Alt+←`, `Alt+→`
- Внешние ссылки открываются в системном браузере

## Установка готового приложения

Скачайте файл из папки `dist/` после сборки или из артефактов GitHub Actions:

| Файл | Платформа |
|------|-----------|
| `Arena AI Setup 1.0.0.exe` | **Windows** — установщик (рекомендуется) |
| `Arena AI 1.0.0.exe` | **Windows** — portable, без установки |
| `Arena AI-*.AppImage` | Linux (универсальный, без установки) |
| `arena-ai-desktop_*_amd64.deb` | Linux (Debian/Ubuntu) |

### Windows — установщик

1. Скачайте `Arena AI Setup 1.0.0.exe`
2. Запустите и следуйте шагам мастера установки
3. Откройте **Arena AI** из меню «Пуск» или с рабочего стола

### Windows — portable

1. Скачайте `Arena AI 1.0.0.exe`
2. Запустите файл — установка не нужна

### Linux — AppImage

```bash
chmod +x "Arena AI-1.0.0.AppImage"
./"Arena AI-1.0.0.AppImage"
```

### Linux — deb

```bash
sudo dpkg -i arena-ai-desktop_1.0.0_amd64.deb
```

## Запуск из исходников

```bash
npm install
npm start
```

## Сборка

```bash
npm install
python3 scripts/generate-icon.py   # требуется pillow: pip install pillow

# Linux
npm run build

# Windows (нужна Windows или CI)
npm run build:win
```

Готовые установщики появятся в папке `dist/`.

> **Примечание:** NSIS-установщик для Windows собирается только на Windows (GitHub Actions делает это автоматически).
