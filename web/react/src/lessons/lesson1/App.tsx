import './App.css'

function App() {
    const names: string[] = ["kirik", "roman", "pid"]
    return (
        <>
            <ul>
                {names.map((name, i) => <li key={i}>{name}</li>)}
            </ul>
        </>
    )
}

export default App