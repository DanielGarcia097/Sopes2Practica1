#include <linux/module.h>       // Needed by all modules
#include <linux/kernel.h>       // KERN_INFO
#include <linux/sched.h>        // for_each_process, pr_info

#include <linux/proc_fs.h>
#include <linux/smp.h>
#include <linux/init.h>
#include <linux/notifier.h>
#include <linux/sched/signal.h>
#include <linux/sched/hotplug.h>
#include <linux/sched/task.h>
#include  <linux/vmstat.h>
#include <linux/moduleparam.h>
#include <asm/uaccess.h>
#include <linux/slab.h> 
#include <linux/string.h>
#include  <linux/fs.h>
#include  <linux/mm.h>
#include  <linux/mman.h>
#include  <linux/mmzone.h>
#include  <linux/swap.h>

MODULE_LICENSE("GPL");
MODULE_DESCRIPTION("Hola Proc");
MODULE_AUTHOR("Daniel Garcia");

/**
 * Nombre del archivo: /proc/holaproc
 * */
static char *message;
#define PROC_ENTRY "info_process"
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
    
    struct task_struct* task_list;
    
    char pid[10];
    
    
    
    read_p = 1;
    message = kmalloc(sizeof(char)*30000, __GFP_IO | __GFP_FS);
    if(message == NULL)
    {
        printk("ERROR, en funcion de proc_open \n");
        return -ENOMEM;
    }
    
    strcat(message, " -Carnet: 201503733\n -Nombre: Daniel Garcia\n -S.O: Debian 9\n");
    
    for_each_process(task_list){
            itoa(task_list->pid, pid, 10);
            
            
            strcat(message,pid);
            strcat(message,",");
            
            strcat(message,task_list->comm);
            strcat(message,",");
            
            if(task_list->state == 0){
                strcat(message,"Runnable");
            }else if(task_list->state > 0 ){
                strcat(message,"Stopped");
            }else if(task_list->state == -1){
                strcat(message,"Unrunnable");
            }
            strcat(message,"\n");
    }
    
    
    

    return 0;
}


void procs_info_print(void)
{
        struct task_struct* task_list;
        size_t process_counter = 0;
        for_each_process(task_list){
                pr_info("== %s [%d]\n", task_list->comm, task_list->pid);
                ++process_counter;
        }
        printk(KERN_INFO "== Number of process: %zu\n", process_counter);
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



int init_module(void)
{
        printk(KERN_INFO "[ INIT ==\n");
        register_proc();
        procs_info_print();
        

        return 0;
}

void cleanup_module(void)
{
        printk(KERN_INFO "== CLEANUP ]\n");
        remove_proc_entry(PROC_ENTRY, NULL);
}
