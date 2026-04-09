import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { AuthProvider, UserRole } from "../../common/user.enums";

@Entity({
    name: 'USERS'
})
export class User {
    
    @PrimaryGeneratedColumn('uuid')
    id!: string
    
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
    password!: string
 
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

    @CreateDateColumn()
    updated_at!: Date

    @CreateDateColumn()
    deleted_at!: Date
}   
