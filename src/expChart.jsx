import React, { useContext } from 'react';
import Context from './context.jsx';

export default function ChartDiagram () {
    const [canvasRef] = useContext(Context);
    return (
        <div id="graphics">
          <h2 style={{ position: 'absolute', top: 370, display: 'none' }}>Данные не найдены</h2>
          <canvas id="round_diagram" ref={canvasRef}></canvas>
        </div>
    );
}