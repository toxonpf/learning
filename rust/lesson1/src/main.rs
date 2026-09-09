fn main() {
    let name = String::from("Alex");

    print_name(&name);

    println!("Still have name: {name}");
}

fn print_name(name: &String) {
    println!("Name: {name}");
}