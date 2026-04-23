/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt 
 */

package com.mycompany.calculadora;

/**
 *
 * @author Aprendiz
 */
public class Calculadora {

    public static void main(String[] args) {
        do {
            Menu.menu();
            Selector.selector();
        } while (Datos.bandera==false);
    }
}
