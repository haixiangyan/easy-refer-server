import {DataTypes} from 'sequelize'
import {AllowNull, BelongsTo, Column, ForeignKey, Model, PrimaryKey, Table, Unique} from 'sequelize-typescript'
import UserModel from '@/models/UserModel'
import ReferModel from '@/models/ReferModel'

@Table({tableName: 'resumes'})
class ResumeModel extends Model<ResumeModel> {
  // 字段
  @Unique
  @AllowNull(false)
  @PrimaryKey
  @Column(DataTypes.STRING)
  public resumeId!: string

  @Column(DataTypes.STRING)
  public name!: string

  @Column(DataTypes.STRING)
  public url!: string

  // 外键
  @ForeignKey(() => UserModel)
  public readonly refereeId!: string | null

  @ForeignKey(() => ReferModel)
  public referId!: string | null

  // 关系
  @BelongsTo(() => UserModel)
  public readonly referee?: UserModel

  @BelongsTo(() => ReferModel)
  public readonly refer?: ReferModel
}

export default ResumeModel
