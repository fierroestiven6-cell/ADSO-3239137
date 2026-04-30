/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt 
 */

package com.mycompany.menajo_arreglo;

import java.util.Scanner;

/**
 *
 * @author Aprendiz
 */
public class Menajo_Arreglo {

    public static void main(String[] args) {
        Scanner teclado=new Scanner(System.in);
        int suma = 0;
        double promedio=0;
        int[]arreglo=new int[10];
        
        for (int i = 0; i < 10; i++) {
            System.out.println("Digitel el valor:"+(i+1));
            arreglo[i]=teclado.nextInt();
            suma=suma+arreglo[i];
            
        }
        
        int mayor=arreglo[0];
        int menor=arreglo[0];
            int posicionMayor=0;
        for (int i = 0; i < 10; i++) {
            System.out.println("El valor"+(i+1)+"es:"+arreglo[i]);
        
        if (arreglo[i]>mayor) {
            mayor=arreglo[i];
            posicionMayor = i;
        }
            if (arreglo[i]<menor) {
             menor=arreglo[i];  
            }
        }
        System.out.println(" la sujma es:"+suma);
        promedio=suma/10;
        System.out.println("el promedio es:"+promedio);
        System.out.println("el numero Mayor es:"+mayor);
        System.out.println("el numero menor es:"+menor);
        System.out.println("El posicion Mayor es:"+posicionMayor);
        
        int impares=0;
        int pares=0;
        for (int i = 0; i < 10; i++) {
            if(arreglo[i]%2==0){
                pares++;
        }else{
                impares++;
            }
}
        System.out.println("las cantidades de impares es:"+impares);
        System.out.println("las cantidades de pares:"+pares);
        
        System.out.println("digite un numero a buscar:");
        int buscar=teclado.nextInt();
        boolean encontrado=false;
        
        for (int i = 0; i < 10; i++) {
             if (arreglo[i] == buscar) {
                encontrado = true;
                break;
        }
}
        if (encontrado) {
            System.out.println("El numero si es existe en el arreglo:");
        }else{
            System.out.println("El numero No existe en el arreglo:");
        }
            System.out.println("Arreglo a revés:");
            for (int i = 9; i >=0; i--) {
                 System.out.println(arreglo[i]);
            }
         System.out.println("----Sin Duplicados----");
         int[]sinrepetidos=new int[10];
         int tamaño=0;
         for (int i = 0; i < 10; i++) {
            boolean repetido=false;
                for (int j = 0; j < tamaño; j++) {
                if (arreglo[i] == sinrepetidos[j]) {
                    repetido = true;
                    break;
        }
        }
                if(!repetido){
                    sinrepetidos[tamaño]=arreglo[i];
                    tamaño++;
                }
                System.out.println("----ordenado----");
                for (int l= 0; i < 10 - 1; i++) {
                for (int j = 0; j < 10 - 1 - i; j++) {

                if (arreglo[j] > arreglo[j + 1]) {
                    int temp = arreglo[j];
                    arreglo[j] = arreglo[j + 1];
                    arreglo[j + 1] = temp;
        }
            }
                }
                
        for (int l= 0; i<10; i++) {
            System.out.println(arreglo[i]);
         }
             System.out.println("Digite numero para saber la frencuencia:");
             int num=teclado.nextInt();
             
           int contador=0;
           
            for (int l= 0; i < 10; i++) {
            if (arreglo[i] == num) {
                contador++;
    }
            }
        System.out.println("Se repite " + contador + " veces");
             System.out.println("----rotado----");
             int ultimo=arreglo[9];
            for (int l= 9; i > 0; i--)
            arreglo[i] = arreglo[i - 1];;

               arreglo[0] = ultimo;

        for (int l= 0; i < 10; i++) {
            System.out.println(arreglo[i]);
        }
    }
}
}

/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt 
 */

package com.mycompany.menajo_arreglo;

import java.util.Scanner;

/**
 *
 * @author Aprendiz
 */
public class Menajo_Arreglo {

    public static void main(String[] args) {
        Scanner teclado=new Scanner(System.in);
        int suma = 0;
        double promedio=0;
        int[]arreglo=new int[10];
        
        for (int i = 0; i < 10; i++) {
            System.out.println("Digitel el valor:"+(i+1));
            arreglo[i]=teclado.nextInt();
            suma=suma+arreglo[i];
            
        }
        
        int mayor=arreglo[0];
        int menor=arreglo[0];
            int posicionMayor=0;
        for (int i = 0; i < 10; i++) {
            System.out.println("El valor"+(i+1)+"es:"+arreglo[i]);
        
        if (arreglo[i]>mayor) {
            mayor=arreglo[i];
            posicionMayor = i;
        }
            if (arreglo[i]<menor) {
             menor=arreglo[i];  
            }
        }
        System.out.println(" la sujma es:"+suma);
        promedio=suma/10;
        System.out.println("el promedio es:"+promedio);
        System.out.println("el numero Mayor es:"+mayor);
        System.out.println("el numero menor es:"+menor);
        System.out.println("El posicion Mayor es:"+posicionMayor);
        
        int impares=0;
        int pares=0;
        for (int i = 0; i < 10; i++) {
            if(arreglo[i]%2==0){
                pares++;
        }else{
                impares++;
            }
}
        System.out.println("las cantidades de impares es:"+impares);
        System.out.println("las cantidades de pares:"+pares);
        
        System.out.println("digite un numero a buscar:");
        int buscar=teclado.nextInt();
        boolean encontrado=false;
        
        for (int i = 0; i < 10; i++) {
             if (arreglo[i] == buscar) {
                encontrado = true;
                break;
        }
}
        if (encontrado) {
            System.out.println("El numero si es existe en el arreglo:");
        }else{
            System.out.println("El numero No existe en el arreglo:");
        }
            System.out.println("Arreglo a revés:");
            for (int i = 9; i >=0; i--) {
                 System.out.println(arreglo[i]);
            }
         System.out.println("----Sin Duplicados----");
         int[]sinrepetidos=new int[10];
         int tamaño=0;
         for (int i = 0; i < 10; i++) {
            boolean repetido=false;
                for (int j = 0; j < tamaño; j++) {
                if (arreglo[i] == sinrepetidos[j]) {
                    repetido = true;
                    break;
        }
        }
                if(!repetido){
                    sinrepetidos[tamaño]=arreglo[i];
                    tamaño++;
                }
                System.out.println("----ordenado----");
                for (int l= 0; i < 10 - 1; i++) {
                for (int j = 0; j < 10 - 1 - i; j++) {

                if (arreglo[j] > arreglo[j + 1]) {
                    int temp = arreglo[j];
                    arreglo[j] = arreglo[j + 1];
                    arreglo[j + 1] = temp;
        }
            }
                }
                
        for (int l= 0; i<10; i++) {
            System.out.println(arreglo[i]);
         }
             System.out.println("Digite numero para saber la frencuencia:");
             int num=teclado.nextInt();
             
           int contador=0;
           
            for (int l= 0; i < 10; i++) {
            if (arreglo[i] == num) {
                contador++;
    }
            }
        System.out.println("Se repite " + contador + " veces");
             System.out.println("----rotado----");
             int ultimo=arreglo[9];
            for (int l= 9; i > 0; i--)
            arreglo[i] = arreglo[i - 1];;

               arreglo[0] = ultimo;

        for (int l= 0; i < 10; i++) {
            System.out.println(arreglo[i]);
        }
    }
}
}
