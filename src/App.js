import React, { useState, useEffect, useRef, useContext } from 'react';
import Chart from './chart.js';
import Context from './context.jsx';
import ChartDiagram from './expChart.jsx';
import MonthExps from './monthExps.jsx';
// import u from './.jsx';

const App = () => {
  const [theme, setTheme] = useState(localStorage.theme || (window.matchMedia("(prefers-color-scheme: light)").matches ? 'light' : 'dark'));
  const [categories, setCategories] = useState(JSON.parse(localStorage.getItem('categories')) || []);
  const [colorCategories, setColorCategories] = useState(JSON.parse(localStorage.getItem('colorCategories')) || {});
  const [exps, setExps] = useState(JSON.parse(localStorage.getItem('exps')) || {});
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState([]);
  const [selectCategory, setSelectCategory] = useState(JSON.parse(localStorage.getItem('categories')) || []);
  const [now, setNow] = useState(new Date());
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const canvasLineRef = useRef(null);
  const chartLineRef = useRef(null);
  const [sortMode, setSortMode] = useState('datetime');
  const [sortDirection, setSortDirection] = useState('up');
  const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

  useEffect(() => {
    let updateColors = {};
    Object.assign(updateColors, colorCategories);
    const genNum = () => (Math.random()*2+Math.random()*205|0).toString(16).padStart(2, '0');
    let changed = false;
    categories.map((cat, index) => {
      if (!Object.keys(colorCategories).includes(cat)) {
        updateColors[cat] = '#'+genNum()+genNum()+genNum();
        changed = true;
      }
    });
    if (changed) {
        setColorCategories(updateColors);
        localStorage.setItem('colorCategories', JSON.stringify(updateColors));
    }
  }, [categories, colorCategories]);

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
    document.body.style.display = '';
    localStorage.theme = theme;

    const handleThemeChange = (e) => {
      setTheme(e.matches ? 'light' : 'dark');
    };

    const useDark = window.matchMedia("(prefers-color-scheme: light)");
    useDark.addListener(handleThemeChange);

    return () => {
      useDark.removeListener(handleThemeChange);
    };
  }, [theme]);

  useEffect(() => {
    updateDiagram(now);
  }, [now]);

  const exportCsv = () => {
    let csvRows = [];
    const headers = ["Date", "Time", "Category", "Amount", "Description"];
    csvRows.push(headers.join(';'));

    const pad = num => String(num).padStart(2, '0');
    for (const key in exps) {
        const values = Object.values(exps[key]);
        const t = new Date(key*1000);
        const dateOperation = `${pad(t.getDate())}.${pad(t.getMonth()+1)}.${t.getFullYear()}`;
        const timeOperation = `${pad(t.getHours())}:${pad(t.getMinutes())}`;
        csvRows.push([dateOperation, timeOperation, ...values].join(';'));
    }
    const a = document.createElement('a');
    a.href = "data:text/csvcharset=utf-8,"+csvRows.join('\n');
    a.download = 'download.csv';
    a.click();
};

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSaveCategory = () => {
    const newCat = document.querySelector('input[name="categoryName"]').value;
    const updatedCategories = [...categories, newCat];
    setCategories(updatedCategories);
    localStorage.setItem('categories', JSON.stringify(updatedCategories));

    setSelectCategory([...selectCategory, newCat]);

    let updateColors = {};
    Object.assign(updateColors, colorCategories);
    const genNum = () => (Math.random()**2*50+Math.random()*205|0).toString(16).padStart(2, '0');
    updateColors[newCat] = '#'+genNum()+genNum()+genNum();
    setColorCategories(updateColors);
    localStorage.setItem('colorCategories', JSON.stringify(updateColors));

    closeDialog();
  };

  const handleSaveExp = () => {
    const categoryName = document.querySelector('select[name="categoryName"]').value;
    const sum = Number(document.querySelector('input[name="sum"]').value);
    const datetime = document.querySelector('input[name="datetime"]').value;
    const description = document.querySelector('textarea[name="description"]').value;
    let updatedExps = {};
    Object.assign(updatedExps, exps);
    updatedExps[new Date(datetime).getTime()/1000|0] = {
        category: categoryName,
        sum, description}
    setExps(updatedExps);
    localStorage.setItem('exps', JSON.stringify(updatedExps));
    closeDialog();
    updateDiagram(now, selectCategory, updatedExps);
  };

  const changeShowCategory = (cat) => {
      let updateSelectCategory = [...selectCategory];
      if (selectCategory.includes(cat)) {
          updateSelectCategory.splice(selectCategory.indexOf(cat), 1);
      } else {
          updateSelectCategory.push(cat);
      }
      setSelectCategory(updateSelectCategory);
      updateDiagram(now, updateSelectCategory);
  };

  const deleteExp = () => {
    const sum = Number(document.querySelector(".dialog p:nth-child(2) span").innerText);
    const categoryName = document.querySelector(".dialog p:nth-child(3) span").innerText;
    const description = document.querySelector(".dialog p:nth-child(4) span").innerText;
    const emDate = getLocalFormat(document.querySelector(".dialog h2 span").innerText);
    const datetime = new Date(emDate).getTime()/1000|0;
    let updatedExps = {};
    Object.assign(updatedExps, exps);
    delete updatedExps[datetime];
    setExps(updatedExps);
    localStorage.setItem('exps', JSON.stringify(updatedExps));
    closeDialog();
    updateDiagram(now, selectCategory, updatedExps);
  }

  const createDialog = (elements) => {
    setDialogVisible(true);
    setTimeout(() => document.querySelector('.backgroundDialog').style.opacity = 1, 1);
    setDialogContent(elements);
  };

  const closeDialog = () => {
    document.querySelector('.backgroundDialog').style.opacity = 0;
    setTimeout(() => {setDialogVisible(false);setDialogContent(<></>)}, 500);
  };

  const getExpsMonth = (exps, now, selectCats=selectCategory) => {
    let daysExps = [];
    const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000;

    let keysExps = Object.keys(exps);
    keysExps.sort(function (elm, nextElm){
        if (sortMode==='sum') {
            if (sortDirection==='down') return exps[nextElm].sum-exps[elm].sum;
            return exps[elm].sum-exps[nextElm].sum;
        } else if (sortMode==='category') {
            if (sortDirection==='down') return (exps[elm].category<exps[nextElm].category ? 1 : -1);
            return (exps[elm].category>exps[nextElm].category ? 1 : -1);
        } else {
            if (sortDirection==='down') return nextElm-elm;
            return elm-nextElm;
        }
    });

    keysExps.forEach((key) => {
      if (key >= month && key < nextMonth) {
        const exp = exps[key];
        if (selectCats.includes(exp.category)) {
            const t = new Date(key*1000);
            const pad = num => String(num).padStart(2, '0');
            daysExps.push({
                sum: exp.sum,
                date: `${pad(t.getDate())}.${pad(t.getMonth()+1)}.${t.getFullYear()}, ${pad(t.getHours())}:${pad(t.getMinutes())}`,
                category: exp.category,
                description: exp.description
            });
        }
      }
    });
    return daysExps;
  }

  const sortExps = () => {
    setSortMode(document.querySelector('select[name="sortMode"]').value);
    setSortDirection(document.querySelector('select[name="sortDirection"]').value);
    closeDialog();
  };

  const getLocalFormat = (date, timeZone=true) => {
    let strDate = date;
    if (typeof date==="string") {
        strDate = date.replaceAll('.', '-').split('-');
        strDate = strDate[1]+'-'+strDate[0]+'-'+strDate[2];
    }
    let localDate = new Date(strDate);
    if (timeZone) localDate = new Date(localDate-localDate.getTimezoneOffset()*60000);
    localDate.setSeconds(null);
    localDate.setMilliseconds(null);
    return localDate.toISOString().slice(0, -1);
  };

  const updateDiagram = (now, selectCats=selectCategory, expss=exps) => {
    let cats = [];
    let sumExps = {};
    let sumDay = {};
    const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000;

    Object.keys(expss).forEach((key) => {
      if (key >= month && key < nextMonth) {
        const exp = expss[key];
        if (selectCats.includes(exp.category)) {
            if (!cats.includes(exp.category)) cats.push(exp.category);
            const date = new Date(key*1000);
            const k = `${date.getDate()} ${months[date.getMonth()].slice(0,3).toLowerCase()}`;
            sumDay[k] = (sumDay[k] || 0) + exp.sum
            sumExps[exp.category] = (sumExps[exp.category] || 0) + exp.sum;
        }
      }
    });

    const data = {
      labels: cats,
      datasets: [
        {
          label: 'Сумма',
          data: Object.values(sumExps),
          borderWidth: 2,
          backgroundColor: cats.map((cat, index) => (colorCategories[cat] || '#0074D9'))
        },
      ],
    };
    const h2 = document.querySelector('#graphics>h2');
    if (!cats.length) {
        h2.style.display = 'block';
    } else {
        h2.style.display = 'none';
    }
    if (chartRef.current) {
      chartRef.current.data = data;
      chartRef.current.update();
    } else {
      chartRef.current = new Chart(canvasRef.current, {
        type: 'pie',
        data: data,
      });
    }
    const dataLine = {
        labels: Object.keys(sumDay),
        datasets: [{
            label: 'Сумма',
            data: Object.values(sumDay),
            fill: true,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.3)',
            tension: 0.2,
            pointBorderWidth: 2,
            pointRadius: 5,
        }]
    };
    if (chartLineRef.current) {
      chartLineRef.current.data = dataLine;
      chartLineRef.current.update();
    } else {
      chartLineRef.current = new Chart(canvasLineRef.current, {
        type: 'line',
        data: dataLine,
      });
    }
  };

  return (
    <div>
      <div className="header">
        <button id="export" onClick={exportCsv}>
          {theme === 'light' ? <img src="/images/export.svg" alt="Экспорт" /> : <img src="/images/export-white.svg" alt="Экспорт" />}
        </button>
        <button id="theme" onClick={toggleTheme}>
          {theme === 'light' ? <img src="/images/moon.svg" alt="Луна" /> : <img src="/images/sun.svg" alt="Солнце" />}
        </button>
      </div>

      <div id="content">
        <div id="calculator" className="zoneActive">
          <Context.Provider value={[canvasRef,canvasLineRef,now,setNow,selectCategory,exps]}>
            <MonthExps />
            <ChartDiagram />
          </Context.Provider>
        </div>

        <div id="right" className="zoneActive">
          <div id="fields">
            <h2 id="category">Категории:</h2>
            <div className="cats">
              {categories.map((cat, index) => (
                <label key={index}>
                  <input type="checkbox" onChange={() => changeShowCategory(cat)} name="category" value={cat} defaultChecked />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
            <button id="newCategory" onClick={() => createDialog(<>
              <h2>Создание новой категории:</h2>
              <label>
                <span>Название категории:</span>
                <input
                  type="text"
                  name="categoryName"
                  placeholder="Например: Продукты"
                />
              </label>
              <button onClick={handleSaveCategory}>Создать категорию</button>
            </>)}>
              Добавить категорию
            </button>

            <div id="infoExps">
              {getExpsMonth(exps,now).length===0 && (<p>Данные не найдены</p>)}
              {getExpsMonth(exps, now).map((exp, index) => (
                <div key={index} onClick={() => createDialog(<>
                    <h2>Ваша трата за <span>{exp.date}</span></h2>
                    <p>Сумма: <span>{exp.sum}</span>₽</p>
                    <p>Категория: <span>{exp.category}</span></p>
                    <p>Описание: <span>{exp.description}</span></p>
                    <button id="editExp" style={{backgroundColor: '#33f'}} onClick={() => createDialog(<>
                        <label>
                          <span>Категория:</span>
                          <select name="categoryName" defaultValue={exp.category}>
                            {categories.map((cat, index) => (
                              <option key={index} defaultValue={cat}>{cat}</option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Сумма:</span>
                          <input type="number" defaultValue={exp.sum} name="sum" placeholder="Введите число" />
                        </label>
                        <label>
                          <span>Дата и время:</span>
                          <input type="datetime-local" defaultValue={getLocalFormat(exp.date)} name="datetime" />
                        </label>
                        <label>
                          <span>Описание:</span>
                          <textarea name="description" defaultValue={exp.description} placeholder="Необязательно" />
                        </label>
                        <button onClick={handleSaveExp}>Сохранить операцию</button>
                        </>)}>Редактировать операцию</button>
                    <button id="deleteExp" style={{backgroundColor: '#f11'}} onClick={deleteExp}>Удалить операцию</button>
                  </>)} className="exp">
                  <p>Сумма: {exp.sum}₽</p>
                  <p>Дата: {exp.date}</p>
                  <p>Категория: {exp.category}</p>
                  <p>Описание: {exp.description}</p>
                </div>
              ))}
            </div>
            <div style={{gap: '10px',display:'flex'}}>
                <button id="sort" onClick={() => createDialog(<>
                    <h2>Сортировка расходов</h2>
                    <label>
                        <span>Сортировать:</span>
                        <select name="sortMode" defaultValue={sortMode}>
                            <option value="datetime">По времени</option>
                            <option value="sum">По сумме</option>
                            <option value="category">По категориям</option>
                        </select>
                    </label>
                    <label>
                        <span>Режим сортировки:</span>
                        <select name="sortDirection" defaultValue={sortMode}>
                            <option value="up">По возрастанию</option>
                            <option value="down">По убыванию</option>
                        </select>
                    </label>
                    <button onClick={sortExps}>Сортировать</button>
                </>)}>Сортировать расходы</button>
                <button disabled={categories.length===0} id="new_spending" onClick={() => createDialog(<>
                  <h2>Создание нового расхода:</h2>
                  <label>
                    <span>Категория:</span>
                    <select name="categoryName">
                      {categories.map((cat, index) => (
                        <option key={index} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Сумма:</span>
                    <input type="number" name="sum" placeholder="Введите число" />
                  </label>
                  <label>
                    <span>Дата и время:</span>
                    <input type="datetime-local" name="datetime" />
                  </label>
                  <label>
                    <span>Описание:</span>
                    <textarea name="description" placeholder="Необязательно" />
                  </label>
                  <button onClick={handleSaveExp}>Создать расход</button>
                </>)}>
                  Создать новый расход
                </button>
            </div>
          </div>
        </div>
      </div>

      {dialogVisible && (
        <div className="backgroundDialog">
          <div className="dialog">
            {dialogContent}
            <button id="closeDialog" onClick={closeDialog}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
