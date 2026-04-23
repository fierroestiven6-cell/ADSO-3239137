/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt 
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java 
 */
package com.mycompany.calculadora;

import java.util.Scanner;

/**
 *
 * @author Aprendiz
 */
public class Datos {
    
    public static Scanner teclado=new Scanner(System.in);
    public static int a,b,op;
    public static double r;
    public static boolean bandera=false;
    
 public static void leer(){
        System.out.println("digitel el valor a");
        Datos.a=Datos.teclado.nextInt();
        System.out.println("digitel el valor b");
        Datos.b=teclado.nextInt();
 }
}
