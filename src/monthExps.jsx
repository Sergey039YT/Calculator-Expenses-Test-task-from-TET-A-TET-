import React, { useContext } from 'react';
import Context from './context.jsx';

export default function ChartDiagram () {
    const [canvasRef,now,setNow,selectCategory,exps] = useContext(Context);
    const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

    const handlePrevMonth = () => {
        setNow(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    };
    const handleNextMonth = () => {
        setNow(new Date(now.getFullYear(), now.getMonth() + 1, 1));
    };
    const getSumExps = (now, selectCats=selectCategory) => {
        let sum = 0;
        const month = new Date(now.getFullYear(), now.getMonth(), 1).getTime() / 1000;
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime() / 1000;
        Object.keys(exps).forEach((key) => {
            if (key >= month && key < nextMonth && selectCats.includes(exps[key].category)) {
                sum += exps[key].sum;
            }
        });
        return sum.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1 ');
    };
    return (
        <div id="listMonth">
          <button id="prevMonth" onClick={handlePrevMonth}>&lt;</button>
          <h4 id="userExps">Ваши расходы за {months[now.getMonth()]}, {now.getFullYear()}: <span>{getSumExps(now)}₽</span></h4>
          <button id="nextMonth" onClick={handleNextMonth}>&gt;</button>
        </div>
    );
}
