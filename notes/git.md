…or create a new repository on the command line
echo "# sys-mon" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/../sys-mon.git
git push -u origin main
…or push an existing repository from the command line
git remote add origin https://github.com/../sys-mon.git
git branch -M main
git push -u origin main
_______________________________________________________________________
Создайте новый репозиторий на GitHub

Не добавляйте README, .gitignore, license

Скопируйте команды, которые GitHub покажет:

bash
# Пример команд от GitHub:
git remote add origin https://github.com/../sys-mon.git
git branch -M main
git push -u origin main
3. Проверить правильность URL:
bash
# Показать URL origin
git remote get-url origin

# Если неправильный - изменить
git remote set-url origin https://github.com/../sys-mon.git
4. Для вашего React проекта:
bash
# Перейдите в папку проекта
cd /path/to/your/react-project

# Инициализируйте git если ещё не сделали
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit"

# Добавьте remote (замените на ваш URL)
git remote add origin https://github.com/../sys-mon.git

# Теперь можно пуллить
git pull origin main --allow-unrelated-histories

# Или если это первый push
git push -u origin main
5. Если репозиторий пустой на сервере:
При первом пуше может потребоваться:

bash
# Создать ветку main если её нет
git branch -M main

# Запушить с установкой upstream
git push -u origin main
6. Проверить доступ:
bash
# Проверить соединение
ssh -T git@github.com  # для SSH

# Или
git ls-remote https://github.com/../sys-mon.git
bash
# Последовательность команд для диагностики:
pwd                     # убедитесь что в папке проекта
ls -la .git            # проверьте что это git репозиторий
git remote -v          # проверьте remotes
git status             # проверьте состояние
Если используете SSH - проверьте ключи:
bash
# Проверить SSH ключи
ls -la ~/.ssh/

# Проверить подключение к GitHub
ssh -T git@github.com
После настройки origin команда git pull origin main будет работать!
_______________________________________________________________________
Работа с Git в VS Code: Подробное руководство
1. Установка и настройка
1.1. Предварительные требования
bash
# Проверка установки Git
git --version

# Если Git не установлен:
# Windows: скачать с git-scm.com
# macOS: brew install git
# Linux: sudo apt-get install git
1.2. Настройка Git (глобальная конфигурация)
bash
# Установка имени пользователя
git config --global user.name "Ваше Имя"

# Установка email
git config --global user.email "ваш.email@example.com"

# Установка редактора по умолчанию (VS Code)
git config --global core.editor "code --wait"

# Проверка конфигурации
git config --list
2. Основные операции в VS Code
2.1. Открытие проекта
Откройте папку проекта в VS Code: File → Open Folder

Инициализируйте Git репозиторий:

Способ 1: Панель управления Source Control (Ctrl+Shift+G)

Способ 2: Терминал: git init

2.2. Панель Source Control
Ключевые элементы:

✓ (Checkmark) - Stage изменения

(Plus) - Stage все изменения

... (More actions) - Дополнительные опции

Commit message поле - для описания коммита

✓ над полем сообщения - Commit staged changes

2.3. Рабочий процесс
Создание и отслеживание файлов:
bash
# В терминале VS Code (Ctrl+`)
git init  # инициализация репозитория
echo "# My Project" > README.md  # создание файла
Проверка статуса:
bash
git status
В VS Code:

Откройте Source Control панель

Измененные файлы появятся в разделе "Changes"

Добавление файлов в staging area:
bash
# Через терминал
git add filename.txt      # конкретный файл
git add .                 # все файлы
Через VS Code:

Наведите на файл в Changes

Нажмите "+" или кликните по иконке Stage Changes

Или используйте командную палитру (Ctrl+Shift+P) → "Git: Stage Changes"

Коммит изменений:
bash
# Через терминал
git commit -m "Initial commit"
Через VS Code:

Введите сообщение коммита в поле

Нажмите Ctrl+Enter или иконку галочки ✓

Важно: Сначала stage изменения, потом коммитьте!

Просмотр истории коммитов:
bash
git log --oneline --graph --all
Через VS Code:

Откройте Command Palette (Ctrl+Shift+P)

Введите "Git: View History (git log)"

Или используйте расширение Git History

3. Работа с ветками
3.1. Создание и переключение веток
bash
# Создание новой ветки
git branch feature/new-feature

# Переключение на ветку
git checkout feature/new-feature

# Создание и переключение одной командой
git checkout -b feature/new-feature
В VS Code:

Кликните на имя ветки в нижнем левом углу

Выберите "Create new branch"

Или Command Palette → "Git: Create Branch"

3.2. Слияние веток
bash
# Переключитесь на ветку, В которую хотите влить изменения
git checkout main

# Выполните слияние
git merge feature/new-feature
В VS Code:

Переключитесь на целевую ветку (main)

Command Palette → "Git: Merge Branch"

Выберите ветку для слияния (feature/new-feature)

3.3. Разрешение конфликтов
Когда возникает конфликт:

VS Code покажет файлы с конфликтами

Откройте конфликтный файл - увидите варианты:

text
<<<<<<< HEAD
Ваши изменения
=======
Изменения из другой ветки
>>>>>>> branch-name
Решение конфликтов в VS Code:

Нажмите на "Accept Current Change", "Accept Incoming Change" или "Accept Both Changes"

Или отредактируйте вручную между маркерами

После разрешения: stage изменения и сделайте коммит

4. Работа с удаленными репозиториями
4.1. Добавление remote
bash
# Добавление удаленного репозитория
git remote add origin https://github.com/username/repo.git

# Проверка remote
git remote -v
В VS Code:

Command Palette → "Git: Add Remote"

Введите URL репозитория

Укажите имя (обычно "origin")

4.2. Отправка изменений (Push)
bash
# Первая отправка (с установкой upstream)
git push -u origin main

# Последующие отправки
git push
В VS Code:

На панели Source Control нажмите "..."

Выберите "Push"

Или используйте иконку синхронизации в статус-баре

4.3. Получение изменений (Pull)
bash
git pull origin main
В VS Code:

На панели Source Control нажмите "..."

Выберите "Pull"

Или используйте иконку синхронизации

5. Полезные расширения для Git в VS Code
Рекомендуемые расширения:
GitLens - расширенная история, blame аннотации

Git Graph - визуализация графа веток

Git History - детальная история изменений

GitHub Pull Requests - для работы с PR

Установка расширений:
Откройте Extensions (Ctrl+Shift+X)

Найдите нужное расширение

Нажмите Install

6. Полезные команды для проверки
bash
# Проверка состояния
git status

# Просмотр изменений
git diff                    # все изменения
git diff --staged          # staged изменения
git diff HEAD~1 HEAD       # изменения последнего коммита

# Просмотр истории
git log --oneline -5       # последние 5 коммитов
git log --graph --all      # графическая история

# Отмена изменений
git checkout -- file.txt   # отмена изменений в файле
git reset HEAD file.txt    # unstage файла
git reset --soft HEAD~1    # отмена последнего коммита (сохранение изменений)

# Очистка
git clean -fd              # удаление неотслеживаемых файлов и папок
7. Типичный рабочий процесс
Ежедневный workflow:
Получить свежие изменения: git pull

Создать ветку для задачи: git checkout -b feature/task-name

Делать изменения в коде

Stage изменения: git add . или через VS Code

Сделать коммит: git commit -m "Описание изменений"

Отправить изменения: git push -u origin feature/task-name

Создать Pull Request (через GitHub/GitLab интерфейс)

После мержа: вернуться в main и обновить: git checkout main && git pull

8. Решение частых проблем
Проблема: "Your local changes would be overwritten"
Решение:

bash
# Сохранить изменения временно
git stash

# Получить обновления
git pull

# Вернуть сохраненные изменения
git stash pop
Проблема: "Failed to push some refs"
Решение:

bash
# Получить изменения и объединить с вашими
git pull --rebase

# Затем попробовать push снова
git push
Проблема: Ошибочный коммит
Решение:

bash
# Изменить последний коммит
git commit --amend -m "Новое сообщение"

# Отменить последний коммит, но сохранить изменения
git reset --soft HEAD~1

# Полностью удалить последний коммит
git reset --hard HEAD~1  # Внимание! Безвозвратно удаляет изменения
9. Полезные настройки VS Code для Git
Добавьте в settings.json (Ctrl+Shift+P → Preferences: Open Settings JSON):

json
{
  "git.enableSmartCommit": true,
  "git.confirmSync": false,
  "git.autofetch": true,
  "git.fetchOnPull": true,
  "editor.formatOnSave": true,
  "gitlens.currentLine.enabled": false,
  "git.decorations.enabled": true
}
10. Best Practices
Частые маленькие коммиты лучше редких больших

Осмысленные сообщения коммитов в present tense

Pull перед Push чтобы избежать конфликтов

Используйте .gitignore для ненужных файлов

Ветвление для каждой новой фичи/бага

Регулярно синхронизируйтесь с удаленным репозиторием

Это руководство покрывает основные аспекты работы с Git в VS Code. Начните с простых операций и постепенно осваивайте более сложные сценарии!