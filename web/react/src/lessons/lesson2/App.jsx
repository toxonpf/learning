import "./App.css";

function Task1(props) {
    return (
        <div>
            <h3>Task1</h3>
            <div>Имя: {props.name}</div>
            <div>Возраст: {props.age}</div>
        </div>
    );
}

function Task2(props) {
    return (
        <div>
            <h3>Task2</h3>
            <div>Имя: {props.user.name}</div>
            <div>Возраст: {props.user.age}</div>
            <div>город: {props.user.city}</div>
        </div>
    )
};

function Task3(props) {
    <div>
        <h3>Task3</h3>
        <ul>
            {props.users.map((i) => <li>{i}</li>)}
        </ul>
    </div>
}

function App() {

    const user = {
        name: "Artem",
        age: 17,
        city: "Almaty"
    };

    const list = [
        "Artem",
        "Roman",
        "Kirik",
        "Ivan"
    ];

    return (
        <main>
            <Task1 name="Artem" age={17} />
            <Task2 user={user} />
            <Task3 list={list} />
        </main>
    );
}

export default App;
