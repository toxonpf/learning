import "./styles.css";

function Task1(props: {name: string; age: number}) {
    return (
        <div>
            <h3>Task1</h3>
            <div>Имя: {props.name}</div>
            <div>Возраст: {props.age}</div>
        </div>
    );
}

interface User {
    name: string
    age: number
    city: string
}

function Task2(props: {user: User}) {
    return (
        <div>
            <h3>Task2</h3>
            <div>Имя: {props.user.name}</div>
            <div>Возраст: {props.user.age}</div>
            <div>город: {props.user.city}</div>
        </div>
    );
}

function Task3(props: {list: string[]}) {
    return (
        <div>
            <h3>Task3</h3>
            <ul>
                {props.list.map((e, i) => (
                    <li key={i}>{e}</li>
                ))}
            </ul>
        </div>
    );
}

function Task4(props: {name: string; price: number; instock: boolean}) {
    return (
        <div>
            <h3>Task4</h3>
            <div className="card">
                <div className="picture"></div>
                <div className="name">{props.name}</div>
                <div className="price">{props.price + " kzt"}</div>
                <div className="instock">{props.instock ? "в наличии" : "нет в наличии"}</div>
            </div>
        </div>
    )
}

function App() {
    const user: User = {
        name: "Artem",
        age: 17,
        city: "Almaty",
    };

    const list: string[] = ["Artem", "Roman", "Kirik", "Ivan"];

    return (
        <main>
            <Task1 name="Artem" age={17} />
            <Task2 user={user} />
            <Task3 list={list} />
            <Task4 name="lol" price={666} instock={true} />
        </main>
    );
}

export default App;
