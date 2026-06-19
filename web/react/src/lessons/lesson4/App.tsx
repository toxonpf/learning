import { useState } from 'react';

function Task1() {
    const [email, setEmail] = useState('');

    function emailForm(e: any) {
        e.preventDefault();
        console.log(email);
    }

    return (
        <form onSubmit={emailForm}>
            <input type="text" onChange={e => setEmail(e.target.value)} />
            <button type='submit'>test</button>
        </form>
    );
}

function App() {

    return (
        <main>
            <Task1></Task1>
        </main>
    )
}

export default App;