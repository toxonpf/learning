import './App.css'

function App() {
    const names = ["kirik", "roman", "pid"];
    return (
        <>
            <ul>
                {names.map(i => <li>{i}</li>)}
            </ul>
        </>
    )
}

export default App