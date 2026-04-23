/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java 
 */
package com.mycompany.calculadora;

/**
 *
 * @author Aprendiz
 */
public class Menu {
    public static void menu(){
        System.out.println("1.Suma");
        System.out.println("2.Resta");
        System.out.println("3.Multiplicación");
        System.out.println("4.division");
        System.out.println("5.salir");
        Datos.op=Datos.teclado.nextInt();
    }
}
