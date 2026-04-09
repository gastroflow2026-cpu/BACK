import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { AuthProvider, UserRole } from "../../common/user.enums";

@Entity({
    name: 'USERS'
})
export class User {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'uuid', nullable: false })
    restaurant_id!:string
    
    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    first_name!: string

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
    })
    last_name!: string

    @Column({
        type: 'varchar',
        length: 50,
        nullable: false,
        unique: true
    })
    email!: string
       
    @Column({
        type: 'varchar',
        length: 70,
        nullable: true,
    })
    password_hash!: string
 
    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CUSTOMER,
    })
    role!: UserRole

    @Column({
        type: 'enum',
        enum: AuthProvider,
    })
    auth_provider!: AuthProvider

    @Column({
        default: true
    })
    is_active!: boolean

    @CreateDateColumn()
    created_at!: Date

    @UpdateDateColumn()
    updated_at!: Date

    @DeleteDateColumn()
    deleted_at!: Date
}   
