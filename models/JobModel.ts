import {DataTypes} from 'sequelize'
import {
  AllowNull,
  BelongsTo,
  Column,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique
} from 'sequelize-typescript'
import UserModel from '@/models/UserModel'
import ReferModel from '@/models/ReferModel'
import {JOB_STATES} from '@/constants/status'

@Table({tableName: 'jobs'})
class JobModel extends Model<JobModel> {
  [key: string]: any

  // 字段
  @Unique
  @AllowNull(false)
  @PrimaryKey
  @Column(DataTypes.STRING)
  public jobId!: string

  @Column(DataTypes.STRING)
  public company!: string

  @Column(DataTypes.JSON)
  public requiredFields!: string

  @Column(DataTypes.DATEONLY)
  public deadline!: Date

  @Column(DataTypes.INTEGER)
  public autoRejectDay!: number

  @Default(0)
  @Column(DataTypes.INTEGER)
  public appliedCount!: number

  @Column(DataTypes.INTEGER)
  public applyTotal!: number

  @Column(DataTypes.STRING)
  public source!: string | null

  @Default(JOB_STATES.active)
  @Column(DataTypes.STRING)
  public status!: string

  // 外键
  @ForeignKey(() => UserModel)
  @Column(DataTypes.STRING)
  public refererId!: string

  // 关系
  @BelongsTo(() => UserModel, 'refererId')
  public readonly referer?: UserModel

  @HasMany(() => ReferModel)
  public readonly referList?: ReferModel[]
}

export default JobModel
