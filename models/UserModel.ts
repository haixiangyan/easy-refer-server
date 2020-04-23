import {DataTypes} from 'sequelize'
import {AllowNull, Column, Default, HasMany, Model, PrimaryKey, Table, Unique} from 'sequelize-typescript'
import JobModel from '@/models/JobModel'
import ReferModel from '@/models/ReferModel'
import ResumeModel from '@/models/ResumeModel'

@Table({tableName: 'users'})
class UserModel extends Model<UserModel> {
  [key: string]: any

  // 字段
  @Unique
  @AllowNull(false)
  @PrimaryKey
  @Column(DataTypes.STRING)
  public userId!: string

  @Column(DataTypes.STRING)
  public password!: string

  @Unique
  @Column(DataTypes.STRING)
  public email!: string

  @Column(DataTypes.INTEGER)
  public experience!: number | null

  @Column(DataTypes.STRING)
  public name!: string | null

  @Column(DataTypes.TEXT)
  public intro!: string | null

  @Column(DataTypes.STRING)
  public leetCodeUrl!: string | null

  @Column(DataTypes.TEXT)
  public thirdPersonIntro!: string | null

  @Column(DataTypes.STRING)
  public phone!: string | null

  @Default('https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png')
  @Column(DataTypes.STRING)
  public avatarUrl!: string

  // 关系
  @HasMany(() => JobModel)
  public readonly jobList?: JobModel[]

  @HasMany(() => ReferModel)
  public readonly myReferList?: ReferModel[]

  @HasMany(() => ReferModel)
  public readonly otherReferList?: ReferModel[]

  @HasMany(() => ResumeModel)
  public readonly resumeList?: ResumeModel[]
}

export default UserModel
