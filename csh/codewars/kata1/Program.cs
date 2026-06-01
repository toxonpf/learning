using System.Collections.Generic;
using System.Linq;
using System;

public class Kata
{
    public static string SpinWords(string sentence)
    {
        var words = sentence.Split();
        string result = "";
        
        foreach (string w in words)
        {
            if (w.Length >= 5)
            {
                result += String.Join("", w.Reverse()) + " ";
                continue;
            }

            result += w + " ";
        }
        
        return result.Trim();
    }

    static void Main()
    {
        Console.WriteLine(SpinWords("Lorem ipsum dolor sit ame"));
    }
}