import "./App.css";

function Task1({ name, age }) {
    return (
        <div>
            <h3>Task1</h3>
            <div>Имя: {name}</div>
            <div>Возраст: {age}</div>
        </div>
    );
}

function Task2({user}) {
    return (
        <div>
            <h3>Task2</h3>
            <div>Имя: {user.name}</div>
            <div>Возраст: {user.age}</div>
            <div>город: {user.city}</div>
        </div>
    );
}

function Task3({list}) {
    return (
        <div>
            <h3>Task3</h3>
            <ul>
                {list.map((e, i) => (
                    <li key={i}>{e}</li>
                ))}
            </ul>
        </div>
    );
}

function Task4({name, price, instock}){
    return (
        <div>
            <h3>Task4</h3>
            <div className="card">
                <div className="picture"></div>
                <div className="name">{name}</div>
                <div className="price">{price + " kzt"}</div>
                <div className="instock">{instock ? "в наличии" : "нет в наличии"}</div>
            </div>
        </div>
    )
}

function App() {
    const user = {
        name: "Artem",
        age: 17,
        city: "Almaty",
    };

    const list = ["Artem", "Roman", "Kirik", "Ivan"];

    return (
        <main>
            <Task1 name="Artem" age={17} />
            <Task2 user={user} />
            <Task3 list={list} />
            <Task4 name={"lol"} price={666} instock={true} />
        </main>
    );
}

export default App;
