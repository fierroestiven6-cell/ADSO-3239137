/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.calculadora;

/**
 *
 * @author Aprendiz
 */
public class Selector {
    public static void selector(){
        switch (Datos.op) {
            case 1:
            {
                Suma.suma();
            }
                break;
        
        case 2:
        {
            Resta.resta();
        }
                
                break;
        
        case 3:
        {
            Multiplicación.multiplicación();
        }
                
        break;
    
    case 4:
    {
        Division.divison();
    }    
                break;
                
                case 5:
                {
                    Datos.bandera=true;
                }
                break;
                
            default:
                System.out.println("El resultado es"+Datos.r);
                
        }
    
}

   
    
}

