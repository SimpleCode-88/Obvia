// == Task Tracker Logic ==
let task = [];

// Add new task to the array
export function addTask(text) {
  task.unshift({ text, completed: false });
  renderTasks();
}

// Toggle task completion
export function toggleTask(index) {
  task[index].completed = !task[index].completed;
  renderTasks();
}

// Delete task
export function deleteTask(index) {
  task.splice(index, 1);
  renderTasks();
}

function saveTasks() {
  safeLocalStorageSetItem(TASKS_KEY, JSON.stringify(task));
}

function renderTasks() {
  taskList.innerHTML = '';
  task.forEach((task, index) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.justifyContent = 'space-between';
    li.style.alignItems = 'center';
    li.style.marginBottom = '0.5rem';

    const taskName = document.createElement('span');
    taskName.style.cursor = 'pointer';
    taskName.style.flexGrow = '1';
    taskName.style.outline = 'none';
    taskName.tabIndex = 0;
    taskName.textContent = task.text;
    if (task.completed) {
      taskName.style.textDecoration = 'line-through';
      taskName.style.color = 'gray';
      li.classList.add('completed');
    } else {
      li.classList.remove('completed');
    }

    taskName.addEventListener('click', () => toggleTask(index));
    taskName.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleTask(index);
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.setAttribute('aria-label', `Remove task: ${task.text}`);
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(index);
    });

    li.appendChild(taskName);
    li.appendChild(removeBtn);
    taskList.appendChild(li);
  });
}

taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const newTaskText = taskInput.value.trim();
  if (!newTaskText) return;

  addTask(newTaskText);
  taskInput.value = '';
  submitBtn.disabled = true;
});

submitBtn.disabled = taskInput.value.trim() === '';
taskInput.addEventListener('input', () => {
  submitBtn.disabled = taskInput.value.trim() === '';
});
