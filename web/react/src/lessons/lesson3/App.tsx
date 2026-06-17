import { useState } from 'react';
import style from "./styles.module.css";

function Task1() {
    const [count, setCount] = useState(0)

    return (
        <div className={style.Task1}>
            <button onClick={() => setCount(count - 1)}>-</button>
            <span>{count}</span>
            <button onClick={() => setCount(count + 1)}>+</button>
        </div>
    )
}

function Task2() {
    const [name, setName] = useState("")
    const [age, setAge] = useState(0)

    return (
        <div>
            <input type="text" placeholder='name' onChange={(e) => setName(e.target.value)} />
            <input type="number" placeholder='age' onChange={(e) => setAge(Number(e.target.value))} />
            <span>Привет, {name}! Тебе {age} лет.</span>
        </div>
    );
}

function Task3() {
    const [state, toggle] = useState("none");

    function toggleModal() {
        toggle(state === "none" ? "block" : "none")
    }

    return (
        <div>
            <button onClick={() => { toggleModal() }}>modal</button>
            <div className={style.modal} style={{display: state}}>
                im modal
            </div>
        </div>
    );
}

function App() {

    return (
        <main>
            <Task1 />
            <Task2 />
            <Task3 />
        </main>
    )
}

export default App;