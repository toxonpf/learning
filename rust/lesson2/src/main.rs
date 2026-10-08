//-----------------------------------------------------
fn main() {
    let mut first_user = User {
        name: "lol".to_string(),
        age: 22,
    };

    fn test(test: &User) {
        test.age;
    }

    test(&first_user);

    println!("{:?}", first_user);
}

#[derive(Debug)]
struct User {
    name: String,
    age: i32,
}
//---------------------------------------------------
// fn greeting(slang: bool) -> String {
//     if slang {
//         "истина".to_string()
//     } else {
//         "лож сука".to_string()
//     }
// }

// fn main (){
//     println!("{}", greeting(true));
//     println!("{}", greeting(false));
// }
//-----------------------------------------------------
