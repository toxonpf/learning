import { useState } from 'react';
import styles from './styles.module.css'
import ListButton from './components/SortButton'
import TackBlock from  './components/taskBlock'

function App() {
    const [activeStateIndex, setActiveStateIndex] = useState(0);
    const [activeListIndex, setactiveListIndex] = useState(0);

    return (
        <form className={styles.root}>
            <input id='search' type="text" placeholder='Поиск по названию' />

            <div className='statesSorts'>
                <ListButton text='все' active={activeStateIndex === 0} onClick={() => setActiveStateIndex(0)} />
                <ListButton text='завершенные' active={activeStateIndex === 1} onClick={() => setActiveStateIndex(1)} />
                <ListButton text='не выполненные' active={activeStateIndex === 2} onClick={() => setActiveStateIndex(2)} />
            </div>
            <div className='listSorts'>
                <ListButton text='По умолчанию' active={activeListIndex === 0} onClick={() => setactiveListIndex(0)} />
                <ListButton text='А - я' active={activeListIndex === 1} onClick={() => setactiveListIndex(1)} />
                <ListButton text='Я - а' active={activeListIndex === 2} onClick={() => setactiveListIndex(2)} />
            </div>
            <div className={styles.addingTasksBlock}>
                <input type="text" placeholder='Новая задача' />
                <button>Добавить</button>
            </div>
            <div className={styles.tasksList}>
                <TackBlock />
            </div>
        </form>
    )
}

export default App;