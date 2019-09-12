#include  <linux/init.h>
#include  <linux/module.h>
#include  <linux/kernel.h>
#include  <linux/proc_fs.h>
#include  <linux/sched.h>
#include  <linux/fs.h>
#include  <linux/mm.h>
#include  <linux/mman.h>
#include  <linux/mmzone.h>
#include  <linux/swap.h>
#include  <linux/vmstat.h>
#include <linux/moduleparam.h>
#include <asm/uaccess.h>
#include <linux/slab.h> 
#include <linux/string.h>

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Hola Proc");
MODULE_AUTHOR("Daniel Garcia");

/**
 * Nombre del archivo: /proc/holaproc
 * */
static char *message;
static char copy[1000];
#define PROC_ENTRY "info_memoria"
static int read_p;


/**
 * 
 * ITOA
 * 
 * */
char * itoa (unsigned long value, char *result, int base)
{
    // check that the base if valid
    if (base < 2 || base > 36) { *result = '\0'; return result; }

    char* ptr = result, *ptr1 = result, tmp_char;
    unsigned long tmp_value;

    do {
        tmp_value = value;
        value /= base;
        *ptr++ = "zyxwvutsrqponmlkjihgfedcba9876543210123456789abcdefghijklmnopqrstuvwxyz" [35 + (tmp_value - value * base)];
    } while ( value );

    // Apply negative sign
    if (tmp_value < 0) *ptr++ = '-';
    *ptr-- = '\0';
    while (ptr1 < ptr) {
        tmp_char = *ptr;
        *ptr--= *ptr1;
        *ptr1++ = tmp_char;
    }
    return result;
}


int myopen(struct inode *sp_inode, struct file *sp_file)
{
    struct sysinfo i;
    si_meminfo(&i);
    
    long memoria_total = i.totalram << (PAGE_SHIFT - 10);
    long memoria_libre = i.freeram << (PAGE_SHIFT - 10);
    
    char mem_total[10];
    itoa(memoria_total, mem_total, 10);
    
    char mem_libre[10];
    itoa(memoria_libre, mem_libre, 10);
    
    char percent_use[10];
    uint64_t percent;
    
    unsigned long usado = memoria_total - memoria_libre;
    percent = (usado * 100)/memoria_total;
    
    unsigned long usado_p = (long)percent;
    itoa(usado_p , percent_use, 10);
    
    read_p = 1;
    message = kmalloc(sizeof(char)*300, __GFP_IO | __GFP_FS);
    if(message == NULL)
    {
        printk("ERROR, en funcion de proc_open \n");
        return -ENOMEM;
    }
    
    strcat(message,"-Carnet: 201503733\n -Nombre: Daniel Garcia\n -S.O: Debian 9\n -Memoria Total \n");
    strcat(message,mem_total);
    strcat(message,"\n -Memoria Libre \n");
    strcat(message,mem_libre);
    strcat(message,"\n -\% De memoria utilizada \n");
    strcat(message,percent_use);
    strcat(message,"%\n");

    return 0;
}

static ssize_t myread(struct file *file, char __user *ubuf,size_t count, loff_t *ppos) 
{
	int len = strlen(message);
    
    read_p = !read_p;
    if(read_p)
    {
        return 0;
    }
    
    copy_to_user(ubuf, message, len);
    return len;
}

int myrelease(struct inode *sp_inode, struct file *sp_file)
{
    //printk("llamada a funcion de proc_release \n");
    kfree(message);
    return 0;
}


static struct file_operations myops = {
        .open = myopen,
        .owner = THIS_MODULE,
        .read = myread,
};

static int register_proc(void){
        struct proc_dir_entry *mem_entry;
        
        mem_entry = proc_create(PROC_ENTRY, 0660, NULL, &myops);
        
        return 0;
}

int init_module(void){
    struct sysinfo i;
    si_meminfo(&i);
    
    
        printk(KERN_ALERT "HOLA MUNDO: %lu \n",i.totalram << (PAGE_SHIFT - 10) );
        
        register_proc();
        return 0;
}

void cleanup_module(void){
    struct sysinfo i;
    si_meminfo(&i);
    remove_proc_entry(PROC_ENTRY, NULL);
        printk(KERN_INFO "ADIOS MUNDO: %lu \n  ",i.freeram);
}



